import { FinancialOverview } from "@/components/app/financial/FinancialOverview";
import { TransactionChartTabs } from "@/components/app/financial/Chart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <FinancialOverview />
      <TransactionChartTabs />
    </div>
  );
}
