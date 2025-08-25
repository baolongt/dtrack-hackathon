import { FinancialOverview } from "@/components/app/financial/FinancialOverview";
import { TransactionChartTabs } from "@/components/app/financial/Chart";
import MarketReports from "../app/market/MarketReports";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <FinancialOverview />
      <TransactionChartTabs />
      <MarketReports />
    </div>
  );
}
