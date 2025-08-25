"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import aggregateTransactionsByDay from "@/lib/aggregate/aggregateByDay";
import useAccountStore from "@/stores/account.store";
import { TransactionDataChartMonthly } from "./MonthlyChart";

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
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("total_received");

  // get transactions from store and aggregate by day for charting
  const labeled = useAccountStore((s) => s.labeledAccounts);
  const storeTxs = labeled?.flatMap((acc) => acc.transactions || []) ?? [];

  const chartData: ChartDataPoint[] = React.useMemo(() => {
    // merge indexed txs + custom txs
    const merged = [...(storeTxs as any[])];
    return aggregateTransactionsByDay(merged) as ChartDataPoint[];
  }, [storeTxs]);

  const total = React.useMemo(
    () => ({
      total_received: chartData.reduce(
        (acc, curr) => acc + curr.total_received,
        0
      ),
      transaction_count: chartData.reduce(
        (acc, curr) => acc + curr.transaction_count,
        0
      ),
    }),
    []
  );

  // compute simple trend for active chart (percent change from previous to last)
  const trend = React.useMemo(() => {
    // only compute trend for keys that exist on ChartDataPoint
    if (chartData.length < 2) return 0;
    if (activeChart !== "total_received" && activeChart !== "transaction_count")
      return 0;
    const sorted = [...chartData].sort(
      (a, b) => +new Date(a.date) - +new Date(b.date)
    );
    const key = activeChart as keyof ChartDataPoint;
    const last = (sorted[sorted.length - 1][key] as number) || 0;
    const prev = (sorted[sorted.length - 2][key] as number) || 0;
    if (prev === 0) return 0;
    return ((last - prev) / Math.abs(prev)) * 100;
  }, [activeChart]);

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Transaction Chart</CardTitle>
          <CardDescription>
            Showing transaction data for the last month
          </CardDescription>
        </div>
        <div className="flex">
          {["total_received", "transaction_count"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={{ fill: `var(--color-${activeChart})` }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending {trend >= 0 ? "up" : "down"} by {trend.toFixed(1)}% this
          period <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing transaction totals for the selected range
        </div>
      </CardFooter>
    </Card>
  );
}

// Main component with tabs
export function TransactionChartTabs() {
  return (
    <div className="w-full">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <TransactionDataChartLine />
        </TabsContent>
        <TabsContent value="monthly">
          <TransactionDataChartMonthly />
        </TabsContent>
      </Tabs>
    </div>
  );
}
