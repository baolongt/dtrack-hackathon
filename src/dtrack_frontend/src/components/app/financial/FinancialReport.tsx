import React, { useMemo, useState } from "react";
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
import autoTable from "jspdf-autotable";
import { Transaction } from "../../../hooks/types";
import {
  SENT_LABEL,
  RECEIVED_LABEL,
  TX_LABELS,
  CUSTOM_TX_LABELS,
} from "@/lib/const";
import {
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
} from "lucide-react";
import useAccountStore from "@/stores/account.store";
import { encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { toIcrcAccount } from "@/lib/utils";

// Helper to format currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

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

  const normalizeAccount = (s: any) => String(s || "").toLowerCase().trim();

  // product tag options come from labeled accounts in the account store
  const labeledAccounts = useAccountStore((s) => s.labeledAccounts);
  const tagOptions = useMemo(() => {
    const map = new Map<string, string>();
    (labeledAccounts || []).forEach((acc) => {
      const p = (acc as any).product || "";
      const key = String(p).toLowerCase().trim();
      if (key && !map.has(key)) map.set(key, String(p));
    });
  return ["allproducts", ...Array.from(map.keys())].map((k) => ({ key: k, label: k === "allproducts" ? "All products" : map.get(k) || k }));
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
      if (accountNormalized && accountsForTag.has(accountNormalized)) return true;
      return false;
    });
  }, [transactions, selectedTag, accountsByProduct]);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthTxs = filteredTransactions.filter(
      (t) =>
        new Date(t.timestamp_ms) >= currentMonthStart &&
        new Date(t.timestamp_ms) <= now
    );
  const prevMonthTxs = filteredTransactions.filter(
      (t) =>
        new Date(t.timestamp_ms) >= prevMonthStart &&
        new Date(t.timestamp_ms) <= prevMonthEnd
    );

    const normalize = (s: string) =>
      s
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const txLabelSet = new Set(TX_LABELS.map((s) => normalize(s)));
    const customLabelSet = new Set(CUSTOM_TX_LABELS.map((s) => normalize(s)));
    const sentNorm = normalize(SENT_LABEL);

    const isOffChainRevenue = (t: Transaction) => {
      if (t.isCustom) return true;
      const norm = normalize(t.label || "");
      if (customLabelSet.has(norm)) return true;
      // also treat explicit "grant" style label from TX_LABELS
      if (txLabelSet.has(norm) && norm.includes("grant")) return true;
      return false;
    };

    const isExpenseLabel = (t: Transaction) => {
      const norm = normalize(t.label || "");
      // consider canonical TX_LABELS and explicit sent label as expenses
      return txLabelSet.has(norm) || norm === sentNorm;
    };

    const calculateMetrics = (txs: Transaction[]) => {
      // classify by isCustom flag: index-derived txs (no isCustom) are on-chain; custom txs or labeled ones are off-chain
      const onChainRevenue = txs
        .filter((t) => !t.isCustom)
        .reduce((sum, t) => sum + t.amount, 0);
      const offChainRevenue = txs
        .filter((t) => isOffChainRevenue(t))
        .reduce((sum, t) => sum + t.amount, 0);
      const totalRevenue = onChainRevenue + offChainRevenue;
      const totalExpenses = txs
        .filter((t) => isExpenseLabel(t))
        .reduce((sum, t) => sum + t.amount, 0);
      const netProfit = totalRevenue - totalExpenses;
      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        onChainRevenue,
        offChainRevenue,
      };
    };

    const currentMetrics = calculateMetrics(currentMonthTxs);
    const prevMetrics = calculateMetrics(prevMonthTxs);

    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? Infinity : 0;
      return ((current - previous) / previous) * 100;
    };

    const totalRevenueChange = calculatePercentageChange(
      currentMetrics.totalRevenue,
      prevMetrics.totalRevenue
    );
    const totalExpensesChange = calculatePercentageChange(
      currentMetrics.totalExpenses,
      prevMetrics.totalExpenses
    );
    const netProfitChange = calculatePercentageChange(
      currentMetrics.netProfit,
      prevMetrics.netProfit
    );

    const totalOnChainRevenue = filteredTransactions
      .filter((t) => !t.isCustom)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOffChainRevenue = filteredTransactions
      .filter(
        (t) =>
          t.isCustom ||
          (t.label || "").toString().toLowerCase().includes("off-chain") ||
          (t.label || "").toString().toLowerCase().includes("grant")
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = totalOnChainRevenue + totalOffChainRevenue;
    const totalExpenses = filteredTransactions
      .filter((t) => {
        const lbl = (t.label || "").toString().toLowerCase();
        return (
          lbl.includes("payment") ||
          lbl.includes("expense") ||
          lbl.includes("expenses")
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalOnChainTransactions = filteredTransactions.filter(
      (t) => !t.isCustom
    ).length;

    const revenueByMonth: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString("default", { month: "short" });
      revenueByMonth[monthName] = 0;
    }

  filteredTransactions.forEach((t) => {
      const txDate = new Date(t.timestamp_ms);
      if (
        txDate.getFullYear() === now.getFullYear() &&
        txDate.getMonth() >= now.getMonth() - 5 &&
        txDate.getMonth() <= now.getMonth()
      ) {
        const monthName = txDate.toLocaleString("default", { month: "short" });
        // count only index-derived (on-chain) transactions for the on-chain revenue chart
        if (!t.isCustom) {
          revenueByMonth[monthName] =
            (revenueByMonth[monthName] || 0) + t.amount;
        }
      }
    });
    const onChainRevenueChartData = Object.keys(revenueByMonth).map(
      (month) => ({ name: month, "On-Chain Revenue": revenueByMonth[month] })
    );

    const totalRevenueBreakdownData = [
      { name: "On-Chain Revenue", value: totalOnChainRevenue },
      { name: "Off-Chain Revenue", value: totalOffChainRevenue },
    ];

    const onChainRevenueTxs = filteredTransactions.filter(
      (t) => !t.isCustom && (t.amount || 0) > 0
    );
    const monthlyFrequency = onChainRevenueTxs.reduce((acc, t) => {
      const monthName = new Date(t.timestamp_ms).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      acc[monthName] = (acc[monthName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const monthlyFrequencyData = Object.keys(monthlyFrequency).map((name) => ({
      name,
      count: monthlyFrequency[name],
    }));

    const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      var weekNo = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
      );
      return weekNo;
    };

    const weeklyFrequency = onChainRevenueTxs.reduce((acc, t) => {
      const date = new Date(t.timestamp_ms);
      const week = `W${getWeekNumber(date)}`;
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const weeklyFrequencyData = Object.keys(weeklyFrequency)
      .sort()
      .map((name) => ({ name, count: weeklyFrequency[name] }));

    return {
      totalRevenue,
      totalRevenueChange,
      netProfit,
      netProfitChange,
      totalExpenses,
      totalExpensesChange,
      totalOnChainTransactions,
      totalOnChainRevenue,
      totalOffChainRevenue,
      onChainRevenueChartData,
      totalRevenueBreakdownData,
      monthlyFrequencyData,
      weeklyFrequencyData,
    };
  }, [filteredTransactions]);

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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Date", "Account", "Label", "Amount"]],
  body: filteredTransactions.map((tx) => [
        tx.id,
        new Date(tx.timestamp_ms).toLocaleString(),
        tx.account,
        tx.label,
        formatCurrency(tx.amount),
      ]),
      headStyles: { fillColor: [24, 38, 58] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
    doc.save("financial-report.pdf");
  };

  return (
    <div className="py-6 flex flex-col gap-8">
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
