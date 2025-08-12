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
import { mockTransactions } from "@/mocks/tx.mock";
import { canisterId, createActor } from "../../../../declarations/icp_index_canister";
import * as React from "react";
import { useAccounts } from "../../hooks/useAccounts";


export interface Transaction {
  id: string;
  amount: number;
  type: string;
  timestamp: number;
  account: string;
}

export function TransactionHistory() {
  const actor = React.useMemo(() =>
    createActor(canisterId, {
      agentOptions: {
        fetch,
        host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:8080' : 'https://ic0.app',
        shouldFetchRootKey: process.env.DFX_NETWORK === 'local' ? true : false,
      }
    }), []
  );

  const { accounts, isLoading, error } = useAccounts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {transaction.id}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    null
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {transaction.address}
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
