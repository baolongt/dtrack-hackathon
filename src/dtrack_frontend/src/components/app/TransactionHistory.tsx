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
import { FileText, FileSpreadsheet } from "lucide-react";
import { canisterId, createActor } from "../../../../declarations/icp_index_canister";
import React, { useMemo } from "react";
import { useAccounts } from "../../hooks/useAccounts";


export function TransactionHistory() {

  const { accounts } = useAccounts();

  const transactions = useMemo(() => {
    return accounts.flatMap((account) => account.transactions || []).sort((a, b) => Number(b.timestamp_nanos) - Number(a.timestamp_nanos));
    ;
  }, [accounts]);

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
          <Table>
            <TableCaption>A list of your recent transactions.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead >Account</TableHead>
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
                  <TableCell className="text-center font-bold">
                    {transaction.account}
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
