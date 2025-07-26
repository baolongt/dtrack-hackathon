import * as React from "react";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockData } from "@/mocks/tx.mock";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "received" | "sent";
  address: string;
  status: "completed" | "pending" | "failed";
}

// Mock transaction data - you can replace this with real data later
const mockTransactions: Transaction[] = [
  {
    id: "tx_001",
    date: "2025-07-26",
    amount: 1250.5,
    type: "received",
    address: "1A2B3C4D5E6F7G8H9I0J",
    status: "completed",
  },
  {
    id: "tx_002",
    date: "2025-07-25",
    amount: 750.25,
    type: "sent",
    address: "9Z8Y7X6W5V4U3T2S1R0Q",
    status: "completed",
  },
  {
    id: "tx_003",
    date: "2025-07-24",
    amount: 2100.0,
    type: "received",
    address: "5M4N3B2V1C6X7Z8A9S0D",
    status: "pending",
  },
  {
    id: "tx_004",
    date: "2025-07-23",
    amount: 500.75,
    type: "sent",
    address: "3Q2W1E4R5T6Y7U8I9O0P",
    status: "failed",
  },
  {
    id: "tx_005",
    date: "2025-07-22",
    amount: 3200.4,
    type: "received",
    address: "7F6G5H4J3K2L1Z9X8C7V",
    status: "completed",
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
};

const getTypeBadgeVariant = (type: string) => {
  return type === "received" ? "default" : "secondary";
};

export function TransactionHistory() {
  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View and manage your recent transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.id}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {transaction.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {transaction.status}
                    </Badge>
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
