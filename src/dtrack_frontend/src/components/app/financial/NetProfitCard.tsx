import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "./utils";

export function NetProfitCard({ netProfit }: { netProfit: number }) {
  return (
    <Card>
      <CardHeader className="flex items-start justify-between pb-4">
        <div>
          <CardDescription className="text-sm text-muted-foreground">
            Net Profit
          </CardDescription>
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(netProfit)}
          </CardTitle>
        </div>
        <div className="text-muted-foreground">
          <TrendingUp className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Total revenue minus total expenses.
        </p>
      </CardContent>
    </Card>
  );
}
