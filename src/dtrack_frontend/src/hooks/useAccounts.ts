import * as React from "react";
import { Principal } from "@dfinity/principal";
import fetch from "isomorphic-fetch";
import { canisterId, createActor } from "../../../declarations/dtrack_backend";
import { canisterId as ledgerCanisterId, createActor as ledgerCreateActor } from "../../../declarations/icp_ledger_canister";
import { canisterId as indexCanisterId, createActor as indexCreateActor } from "../../../declarations/icp_index_canister";
import { icpToUsd } from "../lib/utils";
import { host, shouldFetchRootKey } from "../lib/env";
import { Account, AccountIdentifier } from "@dfinity/ledger-icp";
import { decodeIcrcAccount } from "@dfinity/ledger-icrc";
import { toNullable } from "@dfinity/utils";

// new modular helpers
import { LabeledAccount, Transaction } from "./types";
import { getLabeledAccounts } from "./useLabeledAccounts";
import { getBalancesForAccounts } from "./useBalances";
import { getTransactionLabelsMap } from "./useTransactionLabels";
import { getIndexTransactionsPerAccount } from "./useIndexTransactions";

import BackendService from "../services/backend.service";
import LedgerService from "../services/ledger.service";
import IndexService from "../services/index.service";

// types moved to ./types.ts

const actor = createActor(canisterId, {
    agentOptions: {
        fetch,
        host,
        shouldFetchRootKey,
    },
});

const ledgerActor = ledgerCreateActor(ledgerCanisterId, {
    agentOptions: {
        fetch,
        host,
        shouldFetchRootKey,
    },
});

const indexActor = indexCreateActor(indexCanisterId, {
    agentOptions: {
        fetch,
        host,
        shouldFetchRootKey,
    },
});

// initialize singleton services using the created actors
const backendService = BackendService.getInstance(actor);
const ledgerService = LedgerService.getInstance(ledgerActor);
const indexService = IndexService.getInstance(indexActor);

export function useAccounts() {
    const [accounts, setAccounts] = React.useState<LabeledAccount[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function fetchAccounts() {
        setIsLoading(true);
        setError(null);
        try {
            // 1) labeled accounts from backend
            const labeledAccounts = await getLabeledAccounts(backendService);

            // 2) balances for each labeled account
            const balances = await getBalancesForAccounts(labeledAccounts, ledgerService);

            const accountsWithBalances = labeledAccounts.map((acc, i) => ({
                ...acc,
                balance: balances[i],
            }));

            // 3) fetch transaction labels (single call) and map to string keys
            const customLabelsMap = await getTransactionLabelsMap(backendService);

            // 4) fetch index transactions per account
            const indexTransactionsPerAccount = await getIndexTransactionsPerAccount(accountsWithBalances, indexService, customLabelsMap);

            // 5) fetch custom transactions (user-created) and normalize
            let customTransactions: Transaction[] = [];
            try {
                const customRes = await backendService.getCustomTransactions();
                if (Array.isArray(customRes)) {
                    for (const ct of customRes) {
                        // ct.id is text, ct.timestamp_ms is nat64 (ms), ct.amount is nat64 (assume cents)
                        const idStr = String(ct.id);
                        // amount: cents -> dollars
                        const amountDollars = Number(ct.amount) / 100;
                        // timestamp_ms may be BigInt or number
                        const ts = typeof ct.timestamp_ms === "bigint" ? Number(ct.timestamp_ms) : Number(ct.timestamp_ms ?? 0);
                        customTransactions.push({
                            id: idStr,
                            amount: amountDollars,
                            timestamp_ms: Number.isFinite(ts) ? ts : 0,
                            account: "Custom",
                            label: ct.label,
                            isCustom: true,
                        });
                    }
                }
            } catch {
                // ignore custom tx fetch errors
                customTransactions = [];
            }

            // 6) assemble final accounts with transactions
            const accountsWithTransactions: LabeledAccount[] = accountsWithBalances.map((acc, i) => ({
                ...acc,
                transactions: indexTransactionsPerAccount[i] ?? [],
            }));

            if (customTransactions.length > 0) {
                accountsWithTransactions.push({
                    owner: "custom",
                    label: "Custom",
                    balance: 0,
                    transactions: customTransactions,
                });
            }

            setAccounts(accountsWithTransactions);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch accounts");
        } finally {
            setIsLoading(false);
        }
    }

    async function updateTransactionLabel(transactionId: string, label: string) {
        try {
            // transactionId is string here; backend expects nat64 for index tx labels
            // attempt to convert to BigInt if numeric
            const maybeId = /^\d+$/.test(transactionId) ? BigInt(transactionId) : (transactionId as any);
            const result = await backendService.setTransactionLabel(maybeId, label);
            if (result) {
                await fetchAccounts();
                return true;
            } else {
                throw new Error("set_transaction_label failed");
            }
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Failed to update label");
        }
    }

    async function createCustomTransaction(tx: { timestamp_ms: number; label: string; amount: number }) {
        try {
            // amount: dollars -> cents as nat64
            const amountCents = BigInt(Math.round(tx.amount * 100));
            const timestampNat = BigInt(Math.round(tx.timestamp_ms));
            const result = await backendService.createCustomTransaction({
                id: "",
                timestamp_ms: timestampNat,
                label: tx.label,
                amount: amountCents,
            });
            if (result) {
                await fetchAccounts();
                return { ok: true, id: result };
            } else {
                throw new Error("create_custom_transaction failed");
            }
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Failed to create custom transaction");
        }
    }

    async function updateCustomTransaction(tx: { id: string; timestamp_ms: number; label: string; amount: number }) {
        try {
            const amountCents = BigInt(Math.round(tx.amount * 100));
            const timestampNat = BigInt(Math.round(tx.timestamp_ms));
            const result = await backendService.updateCustomTransaction({
                id: tx.id,
                timestamp_ms: timestampNat,
                label: tx.label,
                amount: amountCents,
            });
            if (result) {
                await fetchAccounts();
                return true;
            } else {
                throw new Error("update_custom_transaction failed");
            }
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Failed to update custom transaction");
        }
    }

    async function deleteCustomTransaction(id: string) {
        try {
            const deleted = await backendService.deleteCustomTransaction(id);
            if (deleted) {
                await fetchAccounts();
                return true;
            }
            throw new Error("delete_custom_transaction failed");
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Failed to delete custom transaction");
        }
    }

    // owner: principal text, label: user label, subaccountHex: optional hex string (e.g. "0xabc..." or "abc...")
    async function addAccount(account: string, label: string) {
        try {
            const decodedAccount = decodeIcrcAccount(account);
            const accountForCall: Account = {
                owner: decodedAccount.owner,
                subaccount: toNullable(decodedAccount.subaccount),
            };
            await backendService.createLabeledAccount({
                label,
                account: accountForCall,
            });
            await fetchAccounts();
            return true;
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Failed to add account");
        }
    }

    async function removeAccount(account: string) {
        try {
            const decodedAccount = decodeIcrcAccount(account);
            const accountForCall: Account = {
                owner: decodedAccount.owner,
                subaccount: toNullable(decodedAccount.subaccount),
            };
            await backendService.deleteLabeledAccount(accountForCall);
            await fetchAccounts();
            return true;
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Failed to remove account");
        }
    }

    return {
        accounts,
        isLoading,
        error,
        fetchAccounts,
        addAccount,
        removeAccount,
        updateTransactionLabel,
        createCustomTransaction,
        updateCustomTransaction,
        deleteCustomTransaction,
    };
}