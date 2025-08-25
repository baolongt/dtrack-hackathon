import { Account } from "@dfinity/ledger-icp";
import { StoredAccount } from "../../../declarations/dtrack_backend/dtrack_backend.did";

export interface LabeledAccount {
    account: StoredAccount;
    label: string;
    balance: number;
    transactions: Transaction[];
}

export interface ICRC1Account {
    account: { 'Icrc1': Account };
    label: string;
    balance: number;
    transactions: Transaction[];
}

export interface OffchainAccount {
    account: { 'Offchain': string };
    label: string;
    balance: number;
    transactions: Transaction[];
}

export interface Transaction {
    id: string;                 // unified id as string (index nat64 or custom text)
    amount: number;             // number in USD (positive for received, negative for sent)
    timestamp_ms: number;       // unix ms timestamp
    account: string;            // account label
    label: string;
    isCustom?: boolean;
}
