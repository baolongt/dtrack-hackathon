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
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  FileSpreadsheet,
  Edit,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import AddTransactionDialog from "./AddTransactionDialog";
import useTransactionHistory from "@/hooks/useTransactionHistory";
import { useMemo, useState } from "react";
import { TX_LABELS } from "@/lib/const";

export function TransactionHistory() {
  const {
    transactions,
  labeledAccounts,
    editingTx,
    setEditingTx,
    isSaving,
    isCreating,
    isDownloading,
    isDownloadingPdf,
    newTx,
    setNewTx,
    currency,
    handleSave,
    handleCancel,
    handleDeleteCustom,
    handleCreate,
    handleDownloadExcel,
    handleDownloadPDF,
    fetchAll,
  } = useTransactionHistory();

  const offchainAccounts = (labeledAccounts || []).
    filter((a) => a.account && typeof a.account === "object" && "Offchain" in (a.account as any)).
    map((a) => ({ id: (a.account as any).Offchain, name: a.label, productTag: a.product }));

  // Filters
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [txType, setTxType] = useState<string>("All");
  const [productFilter, setProductFilter] = useState<string>("All");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("All");

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    (labeledAccounts || []).forEach((a) => {
      if (a.product) set.add(a.product);
    });
    return Array.from(set);
  }, [labeledAccounts]);

  const filteredTransactions = useMemo(() => {
    const fromMs = fromDate ? new Date(fromDate).getTime() : undefined;
    const toMs = toDate
      ? (() => {
          const d = new Date(toDate);
          d.setHours(23, 59, 59, 999);
          return d.getTime();
        })()
      : undefined;

    return transactions.filter((t) => {
      // filter by from/to
      if (fromMs !== undefined) {
        if (!t.timestamp_ms || t.timestamp_ms < fromMs) return false;
      }
      if (toMs !== undefined) {
        if (!t.timestamp_ms || t.timestamp_ms > toMs) return false;
      }
      // filter by tx type/label
      if (txType && txType !== "All") {
        if ((t.label || "") !== txType) return false;
      }
      // find account mapping for product / account type filters
      const acc = labeledAccounts?.find((a) => {
        return (
          a.label === t.account ||
          (a.account && typeof a.account === "object" &&
            "Offchain" in (a.account as any) &&
            (a.account as any).Offchain === t.account)
        );
      });

      // filter by product
      if (productFilter && productFilter !== "All") {
        if (!acc || acc.product !== productFilter) return false;
      }

      // filter by account type (On-chain / Off-chain)
      if (accountTypeFilter && accountTypeFilter !== "All") {
        const acctType = acc && acc.account && typeof acc.account === "object" && "Offchain" in (acc.account as any) ? "Off-chain" : "On-chain";
        if (!acc || acctType !== accountTypeFilter) return false;
      }
      return true;
    });
  }, [transactions, fromDate, toDate, txType, productFilter, accountTypeFilter, labeledAccounts]);

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
                onClick={async () => await fetchAll()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
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

              <AddTransactionDialog
                newTx={newTx}
                setNewTx={setNewTx}
                isCreating={isCreating}
                onCreate={handleCreate}
                accounts={offchainAccounts}
              />
            </div>
          </div>
        </CardHeader>

        {/* Creation moved to AddTransactionDialog */}

        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3 items-end">
            <DatePicker value={fromDate} onChange={setFromDate} label="From" />
            <DatePicker value={toDate} onChange={setToDate} label="To" />
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm">Label</label>
              <Select value={txType} onValueChange={(v) => setTxType(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" key="All">
                    All
                  </SelectItem>
                  {TX_LABELS.map((l) => (
                    <SelectItem value={l} key={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm">Product</label>
              <Select
                value={productFilter}
                onValueChange={(v) => setProductFilter(v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" key="All">
                    All
                  </SelectItem>
                  {productOptions.map((p) => (
                    <SelectItem value={p} key={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm">Type</label>
              <Select
                value={accountTypeFilter}
                onValueChange={(v) => setAccountTypeFilter(v)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" key="All">
                    All
                  </SelectItem>
                  <SelectItem value="On-chain" key="onchain">
                    On-chain
                  </SelectItem>
                  <SelectItem value="Off-chain" key="offchain">
                    Off-chain
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate(undefined);
                  setToDate(undefined);
                  setTxType("All");
                  setProductFilter("All");
                  setAccountTypeFilter("All");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>

          <Table className="table-fixed">
            <TableCaption>A list of your recent transactions.</TableCaption>
            <TableHeader>
                <TableRow className="h-13">
                <TableHead className="w-[140px]">Transaction ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="w-[140px]">Product</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead style={{ width: "240px" }}>Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const acc = labeledAccounts?.find((a) => {
                  return (
                    a.label === transaction.account ||
                    (a.account && typeof a.account === "object" &&
                      "Offchain" in (a.account as any) &&
                      (a.account as any).Offchain === transaction.account)
                  );
                });
                const product = acc?.product || "";
                const accountType = acc && acc.account && typeof acc.account === "object" && "Offchain" in (acc.account as any) ? "Off-chain" : "On-chain";

                return (
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

                    <TableCell>
                      {product ? <Badge variant="secondary">{product}</Badge> : "—"}
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">{acc ? accountType : "—"}</span>
                    </TableCell>

                    <TableCell className="w-[220px]">
                      {editingTx && editingTx.id === transaction.id ? (
                        <div className="flex gap-1 items-center">
                          <Select
                            value={editingTx.label}
                            onValueChange={(v) =>
                              setEditingTx({ ...editingTx, label: v })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TX_LABELS.map((l) => (
                                <SelectItem value={l} key={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
