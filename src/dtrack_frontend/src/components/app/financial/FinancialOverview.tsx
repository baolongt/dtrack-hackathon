import useAccountStore from "@/stores/account.store";
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

// Aggregate transactions (prefer store transactions, fallback to mocks) and compute metrics
const calculateFinancialMetrics = (transactions: any[]): FinancialMetrics => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  // normalize transactions to unified shape: { amount: number, timestamp_ms: number, status?: string }
  const normalized = transactions
    .map((tx) => {
      // already a frontend Transaction shape from store
      if (
        typeof tx.amount === "number" &&
        typeof tx.timestamp_ms === "number"
      ) {
        return tx;
      }

      // mockTransactions shape
      // { id, date, amount, type, address, status }
      if (tx.date) {
        const amt = tx.type === "received" ? tx.amount : -Math.abs(tx.amount);
        return {
          id: tx.id,
          amount: amt,
          timestamp_ms: Date.parse(tx.date),
          account: tx.address ?? "mock",
          label: tx.type ?? "mock",
        };
      }

      // fallback: try best-effort
      return {
        id: tx.id ?? String(Math.random()),
        amount: Number(tx.amount) || 0,
        timestamp_ms: Number(tx.timestamp_ms) || now,
        account: tx.account ?? "unknown",
        label: tx.label ?? "",
      };
    })
    .filter(Boolean) as Array<{ amount: number; timestamp_ms: number }>;

  // overall cash flow (sum of amounts across all normalized txs)
  const cashFlow = normalized.reduce((s, t) => s + (t.amount || 0), 0);

  // Recent revenue: sum of received (amount > 0) in last 7 days
  const recentRevenue = normalized
    .filter((t) => t.amount > 0 && t.timestamp_ms >= now - weekMs)
    .reduce((s, t) => s + t.amount, 0);

  // previous week revenue
  const previousWeekRevenue = normalized
    .filter(
      (t) =>
        t.amount > 0 &&
        t.timestamp_ms >= now - 2 * weekMs &&
        t.timestamp_ms < now - weekMs
    )
    .reduce((s, t) => s + t.amount, 0);

  const revenueGrowth =
    previousWeekRevenue > 0
      ? ((recentRevenue - previousWeekRevenue) / previousWeekRevenue) * 100
      : 0;

  const inventoryLevel = 62; // keep design default

  return {
    cashFlow,
    revenue: recentRevenue,
    revenueGrowth,
    inventoryLevel,
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
  const labeled = useAccountStore((s) => s.labeledAccounts);

  // flatten transactions from store
  const storeTxs = labeled?.flatMap((acc) => acc.transactions || []) ?? [];
  const customTxs = useAccountStore((s) => s.customTransactions) ?? [];

  // merge indexed txs + custom txs so custom transactions are included in metrics
  const txSource = [...storeTxs, ...customTxs];

  const calculated = calculateFinancialMetrics(txSource as any[]);

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
