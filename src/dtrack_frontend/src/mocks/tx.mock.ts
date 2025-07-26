import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';

const randomIdentity = () => {
    const identity = Secp256k1KeyIdentity.generate();
    return identity.getPrincipal().toText();
}

const truncateAddress = (address: string) => {
    if (address.length <= 11) return address;
    return `${address.slice(0, 7)}...${address.slice(-4)}`;
}

export interface TrackedAddress {
    id: string;
    address: string;
    label: string;
    balance: number;
    isActive: boolean;
    dateAdded: string;
}

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    type: "received" | "sent";
    address: string;
    status: "completed" | "pending" | "failed";
}

export const mockTrackedAddresses: TrackedAddress[] = Array.from({ length: 4 }, (_, i) => {
    const labels = ["Main Wallet", "Trading Account", "Cold Storage", "DeFi Protocol"];
    const balances = [15420.75, 8932.5, 45678.9, 2156.25];
    const isActiveStates = [true, true, false, true];
    const dates = ["2025-07-20", "2025-07-18", "2025-07-15", "2025-07-12"];

    return {
        id: `addr_${String(i + 1).padStart(3, '0')}`,
        address: truncateAddress(randomIdentity()),
        label: labels[i],
        balance: balances[i],
        isActive: isActiveStates[i],
        dateAdded: dates[i],
    };
});

export const mockTransactions: Transaction[] = Array.from({ length: 5 }, (_, i) => {
    const amounts = [1250.5, 750.25, 2100.0, 500.75, 3200.4];
    const types: ("received" | "sent")[] = ["received", "sent", "received", "sent", "received"];
    const statuses: ("completed" | "pending" | "failed")[] = ["completed", "completed", "pending", "completed", "completed"];
    const dates = ["2025-07-26", "2025-07-25", "2025-07-24", "2025-07-23", "2025-07-22"];

    return {
        id: `tx_${String(i + 1).padStart(3, '0')}`,
        date: dates[i],
        amount: amounts[i],
        type: types[i],
        address: truncateAddress(randomIdentity()),
        status: statuses[i],
    };
});

export const mockData = {
    "TransactionSummary": Array.from({ length: 30 }, (_, i) => ({
        total_received: Math.floor(Math.random() * 1000000),
        transaction_count: Math.floor(Math.random() * 100),
        date: new Date(2024, 3, 1 + i).toISOString().split('T')[0] // Incrementing dates starting from 2024-04-01
    })),
    "TransactionSummaryMonthly": Array.from({ length: 12 }, (_, i) => ({
        total_received: Math.floor(Math.random() * 100000000),
        transaction_count: Math.floor(Math.random() * 100),
        date: new Date(2024, i, 1).toISOString().split('T')[0] // Monthly data for 2024
    })),
};