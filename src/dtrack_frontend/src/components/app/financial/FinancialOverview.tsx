import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { mockData, mockTransactions } from "@/mocks/tx.mock";
import { TotalRevenueCard } from "./TotalRevenueCard";
import { NetProfitCard } from "./NetProfitCard";
import { TotalExpensesCard } from "./TotalExpensesCard";

interface FinancialMetrics {
  cashFlow: number;
  revenue: number;
  revenueGrowth: number;
  inventoryLevel: number;
}

interface FinancialOverviewProps {
  metrics?: Partial<FinancialMetrics>;
  revenue?: number;
  netProfit?: number;
  expenses?: number;
}

// Calculate financial metrics from mock data
const calculateFinancialMetrics = (): FinancialMetrics => {
  // Calculate total revenue from recent transactions
  const totalReceived = mockTransactions
    .filter((tx) => tx.type === "received" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSent = mockTransactions
    .filter((tx) => tx.type === "sent" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Cash flow = received - sent
  const cashFlow = totalReceived - totalSent;

  // Revenue from last 30 days of transaction summary
  const recentRevenue = mockData.TransactionSummary.slice(-7) // Last 7 days
    .reduce((sum, day) => sum + day.total_received, 0);

  // Calculate growth (mock calculation)
  const previousWeekRevenue = mockData.TransactionSummary.slice(-14, -7) // Previous 7 days
    .reduce((sum, day) => sum + day.total_received, 0);

  const revenueGrowth =
    previousWeekRevenue > 0
      ? ((recentRevenue - previousWeekRevenue) / previousWeekRevenue) * 100
      : 0;

  // Mock inventory level (62% as shown in the design)
  const inventoryLevel = 62;

  return {
    cashFlow: cashFlow,
    revenue: recentRevenue,
    revenueGrowth: revenueGrowth,
    inventoryLevel: inventoryLevel,
  };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(1)}%`;
};

export function FinancialOverview(props: FinancialOverviewProps) {
  const calculated = calculateFinancialMetrics();

  // start from calculated metrics and override with any provided props
  const metrics: FinancialMetrics = {
    cashFlow: props.metrics?.cashFlow ?? calculated.cashFlow,
    revenue: props.metrics?.revenue ?? props.revenue ?? calculated.revenue,
    revenueGrowth: props.metrics?.revenueGrowth ?? calculated.revenueGrowth,
    inventoryLevel: props.metrics?.inventoryLevel ?? calculated.inventoryLevel,
  };

  // derived values, allow direct overrides
  const netProfit = props.netProfit ?? metrics.revenue - metrics.cashFlow;
  const expenses = props.expenses ?? metrics.revenue - netProfit;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <TotalRevenueCard revenue={metrics.revenue} />
        <NetProfitCard netProfit={netProfit} />
        <TotalExpensesCard expenses={expenses} />
      </div>
    </div>
  );
}
