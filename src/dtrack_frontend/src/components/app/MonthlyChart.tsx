"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { mockData } from "@/mocks/tx.mock";

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

// Monthly Chart Component
const monthlyChartData: ChartDataPoint[] =
  mockData.TransactionSummaryMonthly.reduce(
    (acc: ChartDataPoint[], curr: any) => {
      const month = curr.date.substring(0, 7); // Extract YYYY-MM
      const existingMonth = acc.find((item) => item.date === month);

      if (existingMonth) {
        existingMonth.total_received += curr.total_received;
        existingMonth.transaction_count += curr.transaction_count;
      } else {
        acc.push({
          date: month,
          total_received: curr.total_received,
          transaction_count: curr.transaction_count,
        });
      }

      return acc;
    },
    []
  );

export function TransactionDataChartMonthly() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("total_received");

  const total = React.useMemo(
    () => ({
      total_received: monthlyChartData.reduce(
        (acc, curr) => acc + curr.total_received,
        0
      ),
      transaction_count: monthlyChartData.reduce(
        (acc, curr) => acc + curr.transaction_count,
        0
      ),
    }),
    []
  );

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Monthly Transaction Chart</CardTitle>
          <CardDescription>
            Showing monthly aggregated transaction data
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
            data={monthlyChartData}
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
                return value; // Show YYYY-MM format
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return `Month: ${value}`;
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
