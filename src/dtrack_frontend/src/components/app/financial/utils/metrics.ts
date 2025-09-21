import { Transaction } from "../../../../hooks/types";
import { SENT_LABEL, TX_LABELS, CUSTOM_TX_LABELS } from "@/lib/const";
import { encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { toIcrcAccount } from "@/lib/utils";

export type FinancialMetrics = {
    totalRevenue: number;
    totalRevenueChange: number;
    netProfit: number;
    netProfitChange: number;
    totalExpenses: number;
    totalExpensesChange: number;
    totalOnChainTransactions: number;
    totalOnChainRevenue: number;
    totalOffChainRevenue: number;
    onChainRevenueChartData: { name: string; "On-Chain Revenue": number }[];
    totalRevenueBreakdownData: { name: string; value: number }[];
    monthlyFrequencyData: { name: string; count: number }[];
    weeklyFrequencyData: { name: string; count: number }[];
};

export function computeFinancialMetrics(
    transactions: Transaction[] = [],
    now: Date = new Date()
): FinancialMetrics {
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthTxs = transactions.filter(
        (t) => new Date(t.timestamp_ms) >= currentMonthStart && new Date(t.timestamp_ms) <= now
    );
    const prevMonthTxs = transactions.filter(
        (t) => new Date(t.timestamp_ms) >= prevMonthStart && new Date(t.timestamp_ms) <= prevMonthEnd
    );

    const normalize = (s: string) =>
        s
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

    const txLabelSet = new Set(TX_LABELS.map((s) => normalize(s)));
    const customLabelSet = new Set(CUSTOM_TX_LABELS.map((s) => normalize(s)));
    const sentNorm = normalize(SENT_LABEL);

    const isOffChainRevenue = (t: Transaction) => {
        if ((t as any).isCustom) return true;
        const norm = normalize((t as any).label || "");
        if (customLabelSet.has(norm)) return true;
        if (txLabelSet.has(norm) && norm.includes("grant")) return true;
        return false;
    };

    const isExpenseLabel = (t: Transaction) => {
        const norm = normalize((t as any).label || "");
        return txLabelSet.has(norm) || norm === sentNorm;
    };

    const calculateMetrics = (txs: Transaction[]) => {
        const onChainRevenue = txs.filter((t) => !(t as any).isCustom).reduce((sum, t) => sum + t.amount, 0);
        const offChainRevenue = txs.filter((t) => isOffChainRevenue(t)).reduce((sum, t) => sum + t.amount, 0);
        const totalRevenue = onChainRevenue + offChainRevenue;
        const totalExpenses = txs.filter((t) => isExpenseLabel(t)).reduce((sum, t) => sum + t.amount, 0);
        const netProfit = totalRevenue + totalExpenses;
        return { totalRevenue, totalExpenses, netProfit, onChainRevenue, offChainRevenue };
    };

    const currentMetrics = calculateMetrics(currentMonthTxs);
    const prevMetrics = calculateMetrics(prevMonthTxs);

    const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? Infinity : 0;
        return ((current - previous) / previous) * 100;
    };

    const totalRevenueChange = calculatePercentageChange(currentMetrics.totalRevenue, prevMetrics.totalRevenue);
    const totalExpensesChange = calculatePercentageChange(currentMetrics.totalExpenses, prevMetrics.totalExpenses);
    const netProfitChange = calculatePercentageChange(currentMetrics.netProfit, prevMetrics.netProfit);

    const totalOnChainRevenue = transactions.filter((t) => !(t as any).isCustom).reduce((sum, t) => sum + t.amount, 0);
    const totalOffChainRevenue = transactions
        .filter(
            (t) =>
                (t as any).isCustom ||
                (t.label || "").toString().toLowerCase().includes("off-chain") ||
                (t.label || "").toString().toLowerCase().includes("grant")
        )
        .reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = totalOnChainRevenue + totalOffChainRevenue;
    const totalExpenses = transactions
        .filter((t) => {
            const lbl = (t.label || "").toString().toLowerCase();
            return lbl.includes("payment") || lbl.includes("expense") || lbl.includes("expenses");
        })
        .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue + totalExpenses;
    const totalOnChainTransactions = transactions.filter((t) => !(t as any).isCustom).length;

    const revenueByMonth: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString("default", { month: "short" });
        revenueByMonth[monthName] = 0;
    }

    transactions.forEach((t) => {
        const txDate = new Date(t.timestamp_ms);
        if (
            txDate.getFullYear() === now.getFullYear() &&
            txDate.getMonth() >= now.getMonth() - 5 &&
            txDate.getMonth() <= now.getMonth()
        ) {
            const monthName = txDate.toLocaleString("default", { month: "short" });
            if (!(t as any).isCustom) {
                revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + t.amount;
            }
        }
    });

    const onChainRevenueChartData = Object.keys(revenueByMonth).map((month) => ({ name: month, "On-Chain Revenue": revenueByMonth[month] }));

    const totalRevenueBreakdownData = [
        { name: "On-Chain Revenue", value: totalOnChainRevenue },
        { name: "Off-Chain Revenue", value: totalOffChainRevenue },
    ];

    const onChainRevenueTxs = transactions.filter((t) => !(t as any).isCustom && (t.amount || 0) > 0);
    const monthlyFrequency = onChainRevenueTxs.reduce((acc, t) => {
        const monthName = new Date(t.timestamp_ms).toLocaleString("default", {
            month: "short",
            year: "2-digit",
        });
        acc[monthName] = (acc[monthName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const monthlyFrequencyData = Object.keys(monthlyFrequency).map((name) => ({ name, count: monthlyFrequency[name] }));

    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return weekNo;
    };

    const weeklyFrequency = onChainRevenueTxs.reduce((acc, t) => {
        const date = new Date(t.timestamp_ms);
        const week = `W${getWeekNumber(date)}`;
        acc[week] = (acc[week] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const weeklyFrequencyData = Object.keys(weeklyFrequency)
        .sort()
        .map((name) => ({ name, count: weeklyFrequency[name] }));

    console.log({
        totalRevenue,
        totalRevenueChange,
        netProfit,
        netProfitChange,
        totalExpenses,
        totalExpensesChange,
        totalOnChainTransactions,
        totalOnChainRevenue,
        totalOffChainRevenue,
        onChainRevenueChartData,
        totalRevenueBreakdownData,
        monthlyFrequencyData,
        weeklyFrequencyData,
    });

    return {
        totalRevenue,
        totalRevenueChange,
        netProfit,
        netProfitChange,
        totalExpenses,
        totalExpensesChange,
        totalOnChainTransactions,
        totalOnChainRevenue,
        totalOffChainRevenue,
        onChainRevenueChartData,
        totalRevenueBreakdownData,
        monthlyFrequencyData,
        weeklyFrequencyData,
    };
}
