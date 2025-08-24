import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "./utils";

export function TotalRevenueCard({ revenue }: { revenue: number }) {
  return (
    <Card>
      <CardHeader className="flex items-start justify-between pb-4">
        <div>
          <CardDescription className="text-sm text-muted-foreground">
            Total Revenue
          </CardDescription>
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(revenue)}
          </CardTitle>
        </div>
        <div className="text-muted-foreground">
          <DollarSign className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sum of all on-chain and off-chain revenue.
        </p>
      </CardContent>
    </Card>
  );
}
