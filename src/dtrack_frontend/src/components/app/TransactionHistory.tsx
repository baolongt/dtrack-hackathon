import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, Edit, Loader2, Trash2, Plus } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAccounts } from "../../hooks/useAccounts";

export function TransactionHistory() {
  const {
    accounts,
    updateTransactionLabel,
    updateCustomTransaction,
    deleteCustomTransaction,
    createCustomTransaction,
    fetchAccounts,
  } = useAccounts();

  const transactions = useMemo(() => {
    return accounts
      .flatMap((account) => account.transactions || [])
      .sort((a, b) => (b.timestamp_ms || 0) - (a.timestamp_ms || 0));
  }, [accounts]);

  const [editingTx, setEditingTx] = useState<{
    id: string;
    label: string;
    isCustom?: boolean;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // newTx.date holds an HTML datetime-local string (e.g. "2025-08-19T14:30")
  const [newTx, setNewTx] = useState<{ date: string; label: string; amount: string }>({
    date: "",
    label: "",
    amount: "",
  });

  const currency = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  const handleSave = async () => {
    if (!editingTx) return;
    setIsSaving(true);
    try {
      const tx = transactions.find((t) => t.id === editingTx.id);
      if (!tx) throw new Error("transaction not found");

      if (tx.isCustom) {
        // update whole custom transaction (backend expects timestamp_ms + amount in dollars)
        const timestampMs = tx.timestamp_ms ?? Date.now();
        await updateCustomTransaction({
          id: tx.id,
          timestamp_ms: timestampMs,
          label: editingTx.label,
          amount: Number(tx.amount),
        });
      } else {
        // indexed transaction - only label supported by backend
        await updateTransactionLabel(editingTx.id, editingTx.label);
      }
      await fetchAccounts();
      setEditingTx(null);
    } catch (e) {
      // minimal error handling
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTx(null);
  };

  const handleDeleteCustom = async (id: string) => {
    if (!confirm("Delete this custom transaction?")) return;
    try {
      setIsSaving(true);
      await deleteCustomTransaction(id);
      await fetchAccounts();
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
      // newTx.date is an HTML datetime-local string; Date(...) will interpret it as local time
      const timestampMs = new Date(newTx.date).getTime();
      if (Number.isNaN(timestampMs)) throw new Error("Invalid date/time");
      await createCustomTransaction({
        timestamp_ms: timestampMs,
        label: newTx.label,
        amount: amountNum,
      });
      setNewTx({ date: "", label: "", amount: "" });
      setShowCreateForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsCreating(false);
      await fetchAccounts();
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View and manage your recent transactions</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert("Unimplemented")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert("Unimplemented")}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreateForm((s) => !s)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Custom
              </Button>
            </div>
          </div>
        </CardHeader>

        {showCreateForm && (
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-2 items-end">
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newTx.date}
                  onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                  className="border rounded p-1"
                  step="1"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTx.amount}
                  onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  className="border rounded p-1"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm text-muted-foreground">Label</label>
                <input
                  value={newTx.label}
                  onChange={(e) => setNewTx({ ...newTx, label: e.target.value })}
                  className="border rounded p-1 w-full"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} disabled={isCreating}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent>
          <Table className="table-fixed">
            <TableCaption>A list of your recent transactions.</TableCaption>
            <TableHeader>
              <TableRow className="h-13">
                <TableHead className="w-[140px]">Transaction ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead style={{ width: "240px" }}>Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="h-13">
                  <TableCell className="font-mono text-sm font-medium truncate" title={transaction.id}>
                    {transaction.id}
                  </TableCell>
                  <TableCell>
                    {transaction.timestamp_ms
                      ? new Date(transaction.timestamp_ms).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {transaction.amount < 0
                      ? `-${currency.format(Math.abs(Number(transaction.amount)))}`
                      : currency.format(Number(transaction.amount))}
                  </TableCell>
                  <TableCell className="font-bold">
                    <Badge variant="default">{transaction.account}</Badge>
                  </TableCell>

                  <TableCell className="w-[220px]">
                    {editingTx && editingTx.id === transaction.id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          value={editingTx.label}
                          onChange={(e) => setEditingTx({ ...editingTx, label: e.target.value })}
                          className="border rounded p-1 w-full box-border"
                        />
                        <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() =>
                            setEditingTx({ id: transaction.id, label: transaction.label, isCustom: transaction.isCustom })
                          }
                          className="flex-1 flex items-center gap-2 cursor-pointer truncate"
                          title={transaction.label}
                        >
                          <span className="truncate">{transaction.label}</span>
                          <Edit className="h-4 w-4 text-gray-500" />
                        </div>

                        {transaction.isCustom ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustom(transaction.id)}
                            disabled={isSaving}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}