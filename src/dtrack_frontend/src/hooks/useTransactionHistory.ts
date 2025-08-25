import React, { useEffect, useMemo, useState } from "react";
import useAccountStore from "@/stores/account.store";
import type { Transaction } from "@/hooks/types";
import { useShallow } from "zustand/shallow";

export function useTransactionHistory() {
    const {
        labeledAccounts,
        customTransactions,
        updateTransactionLabel,
        updateCustomTransaction,
        deleteCustomTransaction,
        createCustomTransaction,
        fetchIndexTransactions,
        fetchAll,
    } = useAccountStore(
        useShallow((s) => ({
            labeledAccounts: s.labeledAccounts,
            customTransactions: s.customTransactions,
            updateTransactionLabel: s.updateTransactionLabel,
            updateCustomTransaction: s.updateCustomTransaction,
            deleteCustomTransaction: s.deleteCustomTransaction,
            createCustomTransaction: s.createCustomTransaction,
            fetchIndexTransactions: s.fetchIndexTransactions,
            fetchAll: s.fetchAll,
        }))
    );

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editingTx, setEditingTx] = useState<{
        id: string;
        label: string;
        isCustom?: boolean;
    } | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [newTx, setNewTx] = useState<{
        date: string;
        label: string;
        amount: string;
        account?: string;
    }>({
        date: "",
        label: "",
        amount: "",
        account: "custom",
    });

    useEffect(() => {
        // include index transactions (per-account) and global custom transactions
        const indexTxs: Transaction[] = labeledAccounts.flatMap((a) => a.transactions || []);
        const customTxs: Transaction[] = customTransactions || [];

        // merge and dedupe by id (prefer first occurrence)
        const byId = new Map<string, Transaction>();
        for (const t of [...indexTxs, ...customTxs]) {
            if (!t || !t.id) continue;
            if (!byId.has(String(t.id))) byId.set(String(t.id), t);
        }
        const allTxs = Array.from(byId.values()).sort((a, b) => (b.timestamp_ms || 0) - (a.timestamp_ms || 0));
        setTransactions(allTxs);
    }, [labeledAccounts, customTransactions]);

    const currency = useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
            }),
        []
    );

    const handleSave = async () => {
        if (!editingTx) return;
        setIsSaving(true);
        try {
            const tx = transactions.find((t) => t.id === editingTx.id);
            if (!tx) throw new Error("transaction not found");

            if (tx.isCustom) {
                const timestampMs = tx.timestamp_ms ?? Date.now();
                await updateCustomTransaction({
                    id: tx.id,
                    timestamp_ms: timestampMs,
                    label: editingTx.label,
                    amount: Number(tx.amount),
                    account: tx.account,
                });
            } else {
                await updateTransactionLabel(editingTx.id, editingTx.label);
            }
            await fetchAll();
            setEditingTx(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => setEditingTx(null);

    const handleDeleteCustom = async (id: string) => {
        if (!confirm("Delete this custom transaction?")) return;
        setIsSaving(true);
        try {
            await deleteCustomTransaction(id);
            await fetchAll();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsCreating(true);
        try {
            const amountNum = Number(newTx.amount);
            if (!newTx.label || !newTx.date || Number.isNaN(amountNum)) {
                throw new Error("Provide valid date, label and amount");
            }
            const timestampMs = new Date(newTx.date).getTime();
            if (Number.isNaN(timestampMs)) throw new Error("Invalid date/time");
            await createCustomTransaction({
                timestamp_ms: timestampMs,
                label: newTx.label,
                amount: amountNum,
                account: newTx.account || 'custom',
            });
            setNewTx({ date: "", label: "", amount: "" });
            setShowCreateForm(false);
            await fetchAll();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            setIsDownloading(true);
            const XLSX = (await import("xlsx")) as any;
            if (!XLSX || !XLSX.utils) throw new Error("xlsx library not available");

            const rows = transactions.map((tx) => {
                const amountNum = Number(tx.amount);
                return {
                    "Transaction ID": tx.id,
                    Time: tx.timestamp_ms ? new Date(tx.timestamp_ms).toLocaleString() : "",
                    "Timestamp (ms)": tx.timestamp_ms ?? "",
                    Amount: amountNum,
                    "Amount (formatted)": currency.format(amountNum),
                    Account: tx.account,
                    Label: tx.label,
                    "Is Custom": tx.isCustom ? "Yes" : "No",
                };
            });

            const ws = XLSX.utils.json_to_sheet(rows, { origin: "A1" });
            const colWidths = [
                { wch: 36 },
                { wch: 20 },
                { wch: 18 },
                { wch: 12 },
                { wch: 18 },
                { wch: 18 },
                { wch: 36 },
                { wch: 10 },
            ];
            ws["!cols"] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transactions");

            const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
            const filename = `transactions-${ts}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to generate Excel file. Install 'xlsx' package.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setIsDownloadingPdf(true);
            const jspdfModule = await import("jspdf");
            const { jsPDF } = jspdfModule as any;
            if (!jsPDF) throw new Error("jspdf library not available");

            const autoTableModule = await import("jspdf-autotable");
            const autoTableFn = (autoTableModule as any).default ?? (autoTableModule as any);
            if (!autoTableFn) throw new Error("jspdf-autotable not available");

            const doc: any = new jsPDF({ unit: "pt", format: "letter" });

            const columns = [
                "Transaction ID",
                "Time",
                "Timestamp (ms)",
                "Amount",
                "Account",
                "Label",
                "Is Custom",
            ];
            const body = transactions.map((tx) => {
                const amountNum = Number(tx.amount);
                return [
                    tx.id,
                    tx.timestamp_ms ? new Date(tx.timestamp_ms).toLocaleString() : "",
                    tx.timestamp_ms ?? "",
                    tx.amount < 0 ? `-${currency.format(Math.abs(amountNum))}` : currency.format(amountNum),
                    tx.account,
                    tx.label,
                    tx.isCustom ? "Yes" : "No",
                ];
            });

            doc.setFontSize(12);
            doc.text("Transaction History", 40, 40);

            autoTableFn(doc, {
                head: [columns],
                body,
                startY: 60,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [48, 64, 159] },
                columnStyles: {
                    0: { cellWidth: 120 },
                    1: { cellWidth: 85 },
                    2: { cellWidth: 80 },
                    3: { cellWidth: 60 },
                    4: { cellWidth: 60 },
                    5: { cellWidth: 170 },
                    6: { cellWidth: 40 },
                },
            });

            const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
            doc.save(`transactions-${ts}.pdf`);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to generate PDF. Install 'jspdf' and 'jspdf-autotable' packages.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    return {
        transactions,
        editingTx,
        setEditingTx,
        isSaving,
        isCreating,
        isDownloading,
        isDownloadingPdf,
        showCreateForm,
        setShowCreateForm,
        newTx,
        setNewTx,
        currency,
        handleSave,
        handleCancel,
        handleDeleteCustom,
        handleCreate,
        handleDownloadExcel,
        handleDownloadPDF,
        fetchIndexTransactions,
        fetchAll,
    };
}

export default useTransactionHistory;
