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

interface FinancialMetrics {
  cashFlow: number;
  revenue: number;
  revenueGrowth: number;
  inventoryLevel: number;
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

export function FinancialOverview() {
  const metrics = calculateFinancialMetrics();

  return (
    <div className="w-full space-y-6">
      {/* Cash Flow and Revenue Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash Flow Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <CardDescription className="text-blue-700 font-medium">
                Cash Flow
              </CardDescription>
            </div>
            <CardTitle className="text-3xl font-bold text-blue-900">
              {formatCurrency(metrics.cashFlow)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-16 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-lg flex items-center justify-center">
              <div className="w-full h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded opacity-60 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <CardDescription className="text-green-700 font-medium">
                Revenue
              </CardDescription>
            </div>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(metrics.revenue)}
            </CardTitle>
            <div className="flex items-center gap-2">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Badge
                variant={metrics.revenueGrowth >= 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {formatPercentage(metrics.revenueGrowth)} this week
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-12 bg-gradient-to-r from-green-200/30 to-emerald-200/30 rounded-lg flex items-center justify-center">
              <div className="w-3/4 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded opacity-70"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
