"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
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
import {
  TrendingUp,
  TrendingDown,
  MousePointer,
  Clock,
  Users,
} from "lucide-react";

// Mock data for web analytics
const mockAnalyticsData = [
  {
    date: "2024-07-01",
    conversionRate: 2.4,
    bounceRate: 68.5,
    timeOnSite: 145,
  },
  {
    date: "2024-07-02",
    conversionRate: 2.8,
    bounceRate: 65.2,
    timeOnSite: 158,
  },
  {
    date: "2024-07-03",
    conversionRate: 3.1,
    bounceRate: 62.8,
    timeOnSite: 172,
  },
  {
    date: "2024-07-04",
    conversionRate: 2.6,
    bounceRate: 70.1,
    timeOnSite: 139,
  },
  {
    date: "2024-07-05",
    conversionRate: 3.4,
    bounceRate: 59.3,
    timeOnSite: 185,
  },
  {
    date: "2024-07-06",
    conversionRate: 3.0,
    bounceRate: 63.7,
    timeOnSite: 167,
  },
  {
    date: "2024-07-07",
    conversionRate: 3.2,
    bounceRate: 61.4,
    timeOnSite: 178,
  },
  {
    date: "2024-07-08",
    conversionRate: 2.9,
    bounceRate: 66.8,
    timeOnSite: 152,
  },
  {
    date: "2024-07-09",
    conversionRate: 3.5,
    bounceRate: 58.9,
    timeOnSite: 192,
  },
  {
    date: "2024-07-10",
    conversionRate: 3.7,
    bounceRate: 55.2,
    timeOnSite: 201,
  },
  {
    date: "2024-07-11",
    conversionRate: 3.3,
    bounceRate: 60.5,
    timeOnSite: 188,
  },
  {
    date: "2024-07-12",
    conversionRate: 3.8,
    bounceRate: 53.7,
    timeOnSite: 205,
  },
  {
    date: "2024-07-13",
    conversionRate: 3.6,
    bounceRate: 56.8,
    timeOnSite: 195,
  },
  {
    date: "2024-07-14",
    conversionRate: 4.1,
    bounceRate: 51.2,
    timeOnSite: 218,
  },
];

// Current metrics (latest data point)
const currentMetrics = {
  conversionRate:
    mockAnalyticsData[mockAnalyticsData.length - 1].conversionRate,
  bounceRate: mockAnalyticsData[mockAnalyticsData.length - 1].bounceRate,
  timeOnSite: mockAnalyticsData[mockAnalyticsData.length - 1].timeOnSite,
};

// Previous metrics for comparison
const previousMetrics = {
  conversionRate:
    mockAnalyticsData[mockAnalyticsData.length - 2].conversionRate,
  bounceRate: mockAnalyticsData[mockAnalyticsData.length - 2].bounceRate,
  timeOnSite: mockAnalyticsData[mockAnalyticsData.length - 2].timeOnSite,
};

// Calculate percentage changes
const getPercentageChange = (current: number, previous: number) => {
  return ((current - previous) / previous) * 100;
};

const conversionChange = getPercentageChange(
  currentMetrics.conversionRate,
  previousMetrics.conversionRate
);
const bounceChange = getPercentageChange(
  currentMetrics.bounceRate,
  previousMetrics.bounceRate
);
const timeChange = getPercentageChange(
  currentMetrics.timeOnSite,
  previousMetrics.timeOnSite
);

const chartConfig: ChartConfig = {
  conversionRate: {
    label: "Conversion Rate (%)",
    color: "var(--chart-1)",
  },
  bounceRate: {
    label: "Bounce Rate (%)",
    color: "var(--chart-2)",
  },
  timeOnSite: {
    label: "Time on Site (seconds)",
    color: "var(--chart-3)",
  },
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  suffix?: string;
  isInverted?: boolean; // For metrics where lower is better (like bounce rate)
}

function MetricCard({
  title,
  value,
  change,
  icon,
  suffix = "",
  isInverted = false,
}: MetricCardProps) {
  const isPositive = isInverted ? change < 0 : change > 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <TrendIcon className={`mr-1 h-3 w-3 ${changeColor}`} />
          <span className={changeColor}>{Math.abs(change).toFixed(1)}%</span>
          <span className="ml-1">from yesterday</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Conversion Rate Chart
function ConversionRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Rate Trend</CardTitle>
        <CardDescription>
          Daily conversion rate over the past 14 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="conversionRate"
                stroke="var(--color-conversionRate)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Bounce Rate Chart
function BounceRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bounce Rate Trend</CardTitle>
        <CardDescription>
          Daily bounce rate over the past 14 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="bounceRate"
                stroke="var(--color-bounceRate)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Time on Site Chart
function TimeOnSiteChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time on Site Trend</CardTitle>
        <CardDescription>
          Average session duration over the past 14 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis domain={["dataMin - 10", "dataMax + 10"]} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [
                      `${Math.floor(Number(value) / 60)}:${(Number(value) % 60)
                        .toString()
                        .padStart(2, "0")}`,
                      "Time on Site",
                    ]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="timeOnSite"
                stroke="var(--color-timeOnSite)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Format time in minutes and seconds
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Main Web Analytics Component
export function WebAnalytics() {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Conversion Rate"
          value={currentMetrics.conversionRate.toFixed(1)}
          change={conversionChange}
          icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
          suffix="%"
        />
        <MetricCard
          title="Bounce Rate"
          value={currentMetrics.bounceRate.toFixed(1)}
          change={bounceChange}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          suffix="%"
          isInverted={true}
        />
        <MetricCard
          title="Time on Site"
          value={formatTime(currentMetrics.timeOnSite)}
          change={timeChange}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionRateChart />
        <BounceRateChart />
      </div>

      <div className="grid grid-cols-1">
        <TimeOnSiteChart />
      </div>
    </div>
  );
}
