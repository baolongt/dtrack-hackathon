"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

import { ChartConfig } from "@/components/ui/chart";
import useAccountStore from "@/stores/account.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const description = "An interactive line chart";

interface ChartDataPoint {
  date: string;
  total_received: number;
  transaction_count: number;
}

const chartConfig = {
  views: {
    label: "Received",
  },
  total_received: {
    label: "Total Received",
    color: "var(--chart-1)",
  },
  transaction_count: {
    label: "Transaction Count",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function TransactionDataChartLine() {
  // get transactions from store
  const labeled = useAccountStore((s) => s.labeledAccounts);
  const storeTxs = labeled?.flatMap((acc) => acc.transactions || []) ?? [];

  // product filter state
  const [productFilter, setProductFilter] = React.useState("Allproducts");
  
  // compute unique product options from labeled accounts
  const productOptions = React.useMemo(() => {
    if (!labeled || labeled.length === 0) return [];
    const products = new Set(labeled.map(acc => acc.product).filter(Boolean));
    return Array.from(products).sort();
  }, [labeled]);

  // map store transactions into a simplified shape { amount, date, type, product }
  const transactions = React.useMemo(() => {
    return (storeTxs as any[]).map((t) => {
      const amount = Number(t.amount) || 0;
      const date = t.timestamp_ms
        ? new Date(Number(t.timestamp_ms))
        : new Date();
      const label = (t.label || "").toLowerCase();
      let type = "On-chain revenue";
      // heuristic mapping from label to type
      const expenseLabels = new Set(["payment", "purchase", "fee"]);
      if (t.isCustom) {
        type = "Off-chain revenue";
      } else if (expenseLabels.has(label)) {
        type = "On-chain payment";
      } else if (label === "transfer") {
        type = "On-chain payment";
      } else if (label === "refund") {
        type = "On-chain revenue";
      }
      
      // find the product for this transaction by matching account
      let product = "";
      if (labeled) {
        const matchedAccount = labeled.find(acc => {
          // Match transactions to accounts - this is a simplified matching
          // In a real scenario, you'd want more robust account matching
          return acc.transactions && acc.transactions.some(accTx => accTx.id === t.id);
        });
        if (matchedAccount) {
          product = matchedAccount.product || "";
        }
      }
      
      return { amount, date, type, product };
    });
  }, [storeTxs, labeled]);

  // filter transactions based on selected product
  const filteredTransactions = React.useMemo(() => {
    if (productFilter === "Allproducts") {
      return transactions;
    }
    return transactions.filter(t => t.product === productFilter);
  }, [transactions, productFilter]);

  const formatCurrency = (v: number) =>
    `$${v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const { totalRevenue, netProfit, totalExpenses, revenueOverTimeData } =
    React.useMemo(() => {
      // --- Metric Calculations ---
      const totalOnChainRevenue = filteredTransactions
        .filter((t) => t.type === "On-chain revenue")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalOffChainRevenue = filteredTransactions
        .filter(
          (t) => t.type === "On-chain grant" || t.type === "Off-chain revenue"
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const totalRevenue = totalOnChainRevenue + totalOffChainRevenue;

      const totalExpenses = filteredTransactions
        .filter(
          (t) =>
            t.type === "On-chain payment" || t.type === "Off-chain expenses"
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalRevenue - totalExpenses;

      // --- Chart Data Calculation: last 6 months ---
      const now = new Date();
      const revenueByMonth: { [key: string]: number } = {};
      const months: Date[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d);
        const monthName = d.toLocaleString("default", { month: "short" });
        revenueByMonth[monthName] = 0;
      }

      // compute start / end bounds for last 6 months
      const start = new Date(months[0].getFullYear(), months[0].getMonth(), 1);
      const end = new Date(
        months[months.length - 1].getFullYear(),
        months[months.length - 1].getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      filteredTransactions.forEach((t) => {
        const txDate = new Date(t.date);
        if (txDate >= start && txDate <= end) {
          const monthName = txDate.toLocaleString("default", {
            month: "short",
          });
          if (
            t.type === "On-chain revenue" ||
            t.type === "On-chain grant" ||
            t.type === "Off-chain revenue"
          ) {
            revenueByMonth[monthName] =
              (revenueByMonth[monthName] || 0) + t.amount;
          }
        }
      });

      const revenueOverTimeData = months.map((d) => {
        const monthName = d.toLocaleString("default", { month: "short" });
        return {
          name: monthName,
          "Total Revenue": revenueByMonth[monthName] || 0,
        };
      });

      return { totalRevenue, netProfit, totalExpenses, revenueOverTimeData };
    }, [filteredTransactions]);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="tracking-tight text-lg font-medium">
              Total Revenue Over Time
            </h3>
            <p className="text-sm text-muted-foreground">
              A summary of your total revenue over the last 6 months.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Product:</span>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Allproducts">All products</SelectItem>
                {productOptions.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueOverTimeData}
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
                  "Total Revenue",
                ]}
              />
              <Line
                type="monotone"
                dataKey="Total Revenue"
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
  );
}

// Main component with tabs
export function TransactionChartTabs() {
  return (
    <div className="w-full">
      <TransactionDataChartLine />
    </div>
  );
}
