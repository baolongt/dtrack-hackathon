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
import { FileText, FileSpreadsheet, Edit, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAccounts } from "../../hooks/useAccounts";


export function TransactionHistory() {

  const { accounts, updateTransactionLabel, fetchAccounts } = useAccounts();

  const transactions = useMemo(() => {
    return accounts.flatMap((account) => account.transactions || []).sort((a, b) => Number(b.timestamp_nanos) - Number(a.timestamp_nanos));
    ;
  }, [accounts]);

  const [editingTx, setEditingTx] = useState<{
    id: bigint;
    label: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editingTx) {
            setIsSaving(true);

      try {
        await updateTransactionLabel(editingTx.id, editingTx.label);
        await fetchAccounts();
        setEditingTx(null);
      } catch (error) {
        alert("Error updating label");
      }finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setEditingTx(null);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View and manage your recent transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
                    <Table className="table-fixed">
            <TableCaption>A list of your recent transactions.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead >Account</TableHead>
                <TableHead style={{ width: "200px" }}>Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {Number(transaction.id)}
                  </TableCell>
                  <TableCell>
                    {new Date(Math.trunc(Number(transaction.timestamp_nanos) / 1000000)).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {transaction.amount < 0
                      ? `-$${Math.abs(Number(transaction.amount)).toLocaleString()}`
                      : `$${transaction.amount.toLocaleString()}`}
                  </TableCell>
                  <TableCell className="font-bold">
                    <Badge variant="default">{transaction.account}</Badge>
                  </TableCell>

                  <TableCell className="w-[150px]">
                    {editingTx && editingTx.id === transaction.id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          value={editingTx.label}
                          onChange={(e) =>
                            setEditingTx({ ...editingTx, label: e.target.value })
                          }
                          // full width inside the fixed cell so it won't expand the column
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
                      <div
                        onClick={() =>
                          setEditingTx({
                            id: transaction.id,
                            label: transaction.label,
                          })
                        }
                        className="flex items-center gap-2 cursor-pointer truncate"
                      >
                        <span className="truncate">{transaction.label}</span>
                        <Edit className="h-4 w-4 text-gray-500" />
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
