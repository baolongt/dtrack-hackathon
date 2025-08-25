import React, { useMemo } from "react";
import FinancialReport from "@/components/app/financial/FinancialReport";
import useAccountStore from "../../stores/account.store";
import { useShallow } from "zustand/shallow";

export default function FinancialPage() {
  const { labeledAccounts, customTransactions, isLoadingIndex } =
    useAccountStore(
      useShallow((s) => ({
        labeledAccounts: s.labeledAccounts,
        customTransactions: s.customTransactions,
        isLoadingIndex: s.isLoadingIndex,
      }))
    );

  // flatten per-account transactions + custom transactions, normalize shapes and sort by timestamp desc
  const transactions = useMemo(() => {
    const fromAccounts = (labeledAccounts || []).flatMap(
      (a) => a.transactions || []
    );
    const all = [...fromAccounts, ...(customTransactions || [])];

    const now = Date.now();

    const normalized = all
      .map((tx) => {
        // already a frontend Transaction shape from store
        if (
          typeof tx?.amount === "number" &&
          typeof tx?.timestamp_ms === "number"
        ) {
          return tx;
        }

        // mockTransactions shape: { id, date, amount, type, address, status }
        if (tx && (tx as any).date) {
          const amt =
            (tx as any).type === "received"
              ? (tx as any).amount
              : -Math.abs((tx as any).amount);
          return {
            id: String((tx as any).id ?? Math.random()),
            amount: Number(amt) || 0,
            timestamp_ms: Date.parse((tx as any).date) || now,
            account: (tx as any).address ?? "mock",
            label: (tx as any).type ?? "mock",
          } as any;
        }

        // fallback: best-effort mapping
        return {
          id: tx?.id ? String(tx.id) : String(Math.random()),
          amount: Number(tx?.amount) || 0,
          timestamp_ms: Number(tx?.timestamp_ms) || now,
          account: tx?.account ?? "unknown",
          label: tx?.label ?? "",
        } as any;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.timestamp_ms || 0) - (a.timestamp_ms || 0));

    return normalized;
  }, [labeledAccounts, customTransactions]);

  if (isLoadingIndex && transactions.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        Loading financial data…
      </div>
    );
  }

  return <FinancialReport transactions={transactions} />;
}
