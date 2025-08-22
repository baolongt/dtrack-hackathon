export interface LabeledAccount {
    owner: string;
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
