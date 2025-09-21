import React, { useMemo, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { Transaction } from "../../../hooks/types";
import { SENT_LABEL, TX_LABELS, CUSTOM_TX_LABELS } from "@/lib/const";
import { computeFinancialMetrics, FinancialMetrics } from "./utils/metrics";
import {
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
} from "lucide-react";
import useAccountStore from "@/stores/account.store";
import { encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { toIcrcAccount } from "@/lib/utils";
import { formatCurrency } from "./utils";

// Helpers to convert CSS oklch() color strings to rgb(...) strings.
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fromOklabToSRGB = (L: number, a: number, b: number) => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;
  let r = 4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  let g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  let b_lin = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;
  const toSRGB = (c: number) => {
    c = clamp(c);
    if (c <= 0.0031308) return 12.92 * c;
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  r = toSRGB(r);
  g = toSRGB(g);
  b_lin = toSRGB(b_lin);
  return [
    Math.round(clamp(r) * 255),
    Math.round(clamp(g) * 255),
    Math.round(clamp(b_lin) * 255),
  ];
};

const parseOklch = (s: string) => {
  try {
    const inside = s.substring(s.indexOf("(") + 1, s.lastIndexOf(")"));
    const parts = inside
      .replace(/\s+\/.*$/, "")
      .trim()
      .split(/\s+/);
    if (parts.length < 3) return null;
    let L = parts[0];
    let C = parts[1];
    let H = parts[2];
    const parseNumber = (v: string) => {
      if (v.endsWith("%")) return parseFloat(v) / 100;
      return parseFloat(v);
    };
    const Lnum = parseNumber(L);
    const Cnum = parseFloat(C);
    let h = 0;
    if (H.endsWith("deg")) h = (parseFloat(H) * Math.PI) / 180;
    else if (H.endsWith("rad")) h = parseFloat(H);
    else h = (parseFloat(H) * Math.PI) / 180;
    const a = Cnum * Math.cos(h);
    const b = Cnum * Math.sin(h);
    const rgb = fromOklabToSRGB(Lnum, a, b);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  } catch (e) {
    return null;
  }
};

const replaceOklchInString = (s: string) => {
  try {
    return s.replace(/oklch\([^)]*\)/g, (match) => {
      const conv = parseOklch(match);
      return conv || "rgb(0,0,0)";
    });
  } catch (e) {
    return s;
  }
};

const PercentageChange: React.FC<{ value: number }> = ({ value }) => {
  if (isNaN(value) || !isFinite(value)) {
    return <span className="text-muted-foreground">-</span>;
  }
  const isPositive = value >= 0;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span className={`flex items-center text-xs font-medium ${colorClass}`}>
      <Icon className="h-3 w-3 mr-1" />
      {value === Infinity ? "∞" : `${value.toFixed(1)}%`} vs last month
    </span>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  footerContent?: React.ReactNode;
  icon: React.ReactNode;
}> = ({ title, value, footerContent, icon }) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {footerContent && (
          <div className="text-xs text-muted-foreground mt-1">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

const FinancialDashboard: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const [frequencyTimeframe, setFrequencyTimeframe] = useState<
    "monthly" | "weekly"
  >("monthly");
  // selected product tag for filtering charts/metrics. "Allproducts" shows everything
  const [selectedTag, setSelectedTag] = useState<string>("allproducts");

  const normalizeAccount = (s: any) =>
    String(s || "")
      .toLowerCase()
      .trim();

  // product tag options come from labeled accounts in the account store
  const labeledAccounts = useAccountStore((s) => s.labeledAccounts);
  const tagOptions = useMemo(() => {
    const map = new Map<string, string>();
    (labeledAccounts || []).forEach((acc) => {
      const p = (acc as any).product || "";
      const key = String(p).toLowerCase().trim();
      if (key && !map.has(key)) map.set(key, String(p));
    });
    return ["allproducts", ...Array.from(map.keys())].map((k) => ({
      key: k,
      label: k === "allproducts" ? "All products" : map.get(k) || k,
    }));
  }, [labeledAccounts]);

  // map product tag -> set of account strings (representative account identifiers used in tx.account)
  const accountsByProduct = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    (labeledAccounts || []).forEach((acc) => {
      const productRaw = (acc as any).product || "";
      const product = String(productRaw).toLowerCase().trim();
      if (!product) return;
      if (!map[product]) map[product] = new Set<string>();
      const txs = (acc as any).transactions || [];
      if (Array.isArray(txs) && txs.length > 0) {
        txs.forEach((tx: any) => {
          if (tx && tx.account) map[product].add(normalizeAccount(tx.account));
        });
      } else {
        const stored = (acc as any).account;
        try {
          if (stored && typeof stored === "object") {
            if ("Offchain" in stored) {
              map[product].add(normalizeAccount(stored.Offchain));
            } else if ("Icrc1" in stored) {
              const encoded = encodeIcrcAccount(toIcrcAccount(stored.Icrc1));
              map[product].add(normalizeAccount(encoded));
            }
          }
        } catch {
          // ignore encoding errors
        }
      }
      const label = (acc as any).label;
      if (label) map[product].add(normalizeAccount(label));
    });
    return map;
  }, [labeledAccounts]);

  // filtered transactions used for computing metrics and charts
  const filteredTransactions = useMemo(() => {
    const sel = String(selectedTag).toLowerCase().trim();
    if (sel === "allproducts") return transactions;
    const accountsForTag = new Set<string>(
      Array.from(accountsByProduct[sel] || [])
    );
    return transactions.filter((t) => {
      const tag =
        (t as any).product_tag ??
        (t as any).productTag ??
        (t as any).product ??
        (t as any).tag ??
        "";
      if (tag && String(tag).toLowerCase() === sel) return true;
      const accountNormalized = normalizeAccount((t as any).account);
      if (accountNormalized && accountsForTag.has(accountNormalized))
        return true;
      return false;
    });
  }, [transactions, selectedTag, accountsByProduct]);

  const metrics: FinancialMetrics = useMemo(
    () => computeFinancialMetrics(filteredTransactions),
    [filteredTransactions]
  );

  const COLORS = ["hsl(222.2, 47.4%, 11.2%)", "hsl(173, 80%, 40%)"];

  const handleDownloadCSV = () => {
    const headers = ["ID", "Date", "Type", "Label", "Amount", "Account"];
    const csvRows = [
      headers.join(","),
      ...filteredTransactions.map((tx) =>
        [
          `"${tx.id}"`,
          `"${new Date(tx.timestamp_ms).toISOString()}"`,
          `"${tx.account}"`,
          `"${(tx.label || "").toString().replace(/"/g, '""')}"`,
          tx.amount,
          `"${tx.account}"`,
        ].join(",")
      ),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "financial-report.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPDF = async () => {
    try {
      if (!containerRef.current) return;
      const element = containerRef.current;

      const captureWithInlinedStyles = async (sourceEl: HTMLElement) => {
        const clone = sourceEl.cloneNode(true) as HTMLElement;
        const wrapper = document.createElement("div");
        wrapper.style.position = "fixed";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        wrapper.style.width = `${sourceEl.scrollWidth}px`;
        wrapper.style.height = `${sourceEl.scrollHeight}px`;
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        const applyComputedStyles = (orig: Element, copy: Element) => {
          const cs = window.getComputedStyle(orig as Element);
          for (let i = 0; i < cs.length; i++) {
            const prop = cs[i];
            try {
              let val = cs.getPropertyValue(prop);
              if (typeof val === "string") {
                val = replaceOklchInString(val);
              }
              (copy as HTMLElement).style.setProperty(prop, val);
            } catch (_) {
              // ignore any properties that can't be set
            }
          }
          const oChildren = orig.children || [];
          const cChildren = copy.children || [];
          for (let i = 0; i < oChildren.length; i++) {
            if (cChildren[i]) applyComputedStyles(oChildren[i], cChildren[i]);
          }
        };

        applyComputedStyles(sourceEl, clone);

        const canvas = await html2canvas(clone as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        document.body.removeChild(wrapper);
        return canvas;
      };

      const canvas = await captureWithInlinedStyles(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = pdfWidth / imgWidth;
      const imgHeightPDF = imgHeight * ratio;

      let heightLeft = imgHeightPDF;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightPDF);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightPDF;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightPDF);
        heightLeft -= pdfHeight;
      }

      pdf.save("financial-report.pdf");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div ref={containerRef} className="py-6 flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Financial Report</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="product-tag" className="sr-only">
              Product tag
            </label>
            <select
              id="product-tag"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="h-9 px-2 rounded-md bg-muted text-sm"
            >
              {tagOptions.map((opt: any) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDownloadCSV}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 rounded-md flex items-center justify-center gap-2 text-sm font-medium"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 rounded-md flex items-center justify-center gap-2 text-sm font-medium"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          footerContent={
            <PercentageChange value={metrics.totalRevenueChange} />
          }
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          footerContent={<PercentageChange value={metrics.netProfitChange} />}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          footerContent={
            <PercentageChange value={metrics.totalExpensesChange} />
          }
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total On-Chain Transactions"
          value={metrics.totalOnChainTransactions.toString()}
          footerContent="All on-chain transaction types"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <h3 className="tracking-tight text-lg font-medium">
            On-Chain Revenue Over Time
          </h3>
          <p className="text-sm text-muted-foreground">
            A summary of your on-chain revenue over the last 6 months.
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics.onChainRevenueChartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(214.3, 31.8%, 91.4%)"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(215.4, 16.3%, 46.9%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215.4, 16.3%, 46.9%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `$${((value as number) / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214.3, 31.8%, 91.4%)",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{
                    color: "hsl(222.2, 84%, 4.9%)",
                    fontWeight: "bold",
                  }}
                  itemStyle={{ color: "hsl(222.2, 47.4%, 11.2%)" }}
                  formatter={(value) => [
                    formatCurrency(value as number),
                    "On-Chain Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="On-Chain Revenue"
                  stroke="hsl(222.2, 47.4%, 11.2%)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "hsl(222.2, 47.4%, 11.2%)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="tracking-tight text-lg font-medium">
                Total Revenue Breakdown
              </h3>
              <p className="text-sm text-muted-foreground">
                On-chain vs. Off-chain (incl. grants).
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.totalRevenueBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={5}
                    >
                      {metrics.totalRevenueBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <MetricCard
            title="Total On-Chain Revenue"
            value={formatCurrency(metrics.totalOnChainRevenue)}
            footerContent="Sum of all 'On-chain Revenue' transactions."
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Total Off-Chain Revenue"
            value={formatCurrency(metrics.totalOffChainRevenue)}
            footerContent="Sum of 'On-chain Grant' and 'Off-chain Revenue'."
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex items-start justify-between">
            <div>
              <h3 className="tracking-tight text-lg font-medium">
                Transaction Frequency
              </h3>
              <p className="text-sm text-muted-foreground">
                Count of 'On-chain Revenue' transactions.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1 text-sm">
              <button
                onClick={() => setFrequencyTimeframe("monthly")}
                className={`px-2 py-1 rounded ${
                  frequencyTimeframe === "monthly" ? "bg-background shadow" : ""
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setFrequencyTimeframe("weekly")}
                className={`px-2 py-1 rounded ${
                  frequencyTimeframe === "weekly" ? "bg-background shadow" : ""
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="h-[434px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    frequencyTimeframe === "monthly"
                      ? metrics.monthlyFrequencyData
                      : metrics.weeklyFrequencyData
                  }
                >
                  <XAxis
                    dataKey="name"
                    stroke="hsl(215.4, 16.3%, 46.9%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215.4, 16.3%, 46.9%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(210, 40%, 96.1%)", radius: 4 }}
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214.3, 31.8%, 91.4%)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{
                      color: "hsl(222.2, 84%, 4.9%)",
                      fontWeight: "bold",
                    }}
                    itemStyle={{ color: "hsl(222.2, 47.4%, 11.2%)" }}
                    formatter={(value) => [value, "Transactions"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(222.2, 47.4%, 11.2%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
