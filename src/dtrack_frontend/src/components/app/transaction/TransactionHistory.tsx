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
import {
  FileText,
  FileSpreadsheet,
  Edit,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import useTransactionHistory from "@/hooks/useTransactionHistory";

export function TransactionHistory() {
  const {
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
  } = useTransactionHistory();

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
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                className="flex items-center gap-2"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
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
                <label className="text-sm text-muted-foreground">
                  Date & Time
                </label>
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
                <label className="text-sm text-muted-foreground">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTx.amount}
                  onChange={(e) =>
                    setNewTx({ ...newTx, amount: e.target.value })
                  }
                  className="border rounded p-1"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm text-muted-foreground">Label</label>
                <input
                  value={newTx.label}
                  onChange={(e) =>
                    setNewTx({ ...newTx, label: e.target.value })
                  }
                  className="border rounded p-1 w-full"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
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
                  <TableCell
                    className="font-mono text-sm font-medium truncate"
                    title={transaction.id}
                  >
                    {transaction.id}
                  </TableCell>
                  <TableCell>
                    {transaction.timestamp_ms
                      ? new Date(transaction.timestamp_ms).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {transaction.amount < 0
                      ? `-${currency.format(
                          Math.abs(Number(transaction.amount))
                        )}`
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
                          onChange={(e) =>
                            setEditingTx({
                              ...editingTx,
                              label: e.target.value,
                            })
                          }
                          className="border rounded p-1 w-full box-border"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() =>
                            setEditingTx({
                              id: transaction.id,
                              label: transaction.label,
                              isCustom: transaction.isCustom,
                            })
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
