import * as React from "react";
import { Principal } from "@dfinity/principal";
import fetch from "isomorphic-fetch";
import { canisterId, createActor } from "../../../declarations/dtrack_backend";
import { canisterId as ledgerCanisterId, createActor as ledgerCreateActor } from "../../../declarations/icp_ledger_canister";
import { canisterId as indexCanisterId, createActor as indexCreateActor } from "../../../declarations/icp_index_canister";
import { icpToUsd } from "../lib/utils";
import { AccountIdentifier } from "@dfinity/ledger-icp";

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

export function useAccounts() {
    const actor = React.useMemo(
        () =>
            createActor(canisterId, {
                agentOptions: {
                    fetch,
                    host: process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:8080" : "https://ic0.app",
                    shouldFetchRootKey: process.env.DFX_NETWORK === "local" ? true : false,
                },
            }),
        []
    );

    const ledgerActor = React.useMemo(
        () =>
            ledgerCreateActor(ledgerCanisterId, {
                agentOptions: {
                    fetch,
                    host: process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:8080" : "https://ic0.app",
                    shouldFetchRootKey: process.env.DFX_NETWORK === "local" ? true : false,
                },
            }),
        []
    );

    const indexActor = React.useMemo(
        () =>
            indexCreateActor(indexCanisterId, {
                agentOptions: {
                    fetch,
                    host: process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:8080" : "https://ic0.app",
                    shouldFetchRootKey: process.env.DFX_NETWORK === "local" ? true : false,
                },
            }),
        []
    );

    const [accounts, setAccounts] = React.useState<LabeledAccount[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchAccounts = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1) labeled accounts from backend
            const result = await actor.get_labeled_accounts();
            let labeledAccounts: LabeledAccount[] = [];

            if ("Ok" in result) {
                labeledAccounts = result.Ok.map((addr: any) => ({
                    owner: addr.account.owner.toText(),
                    label: addr.label,
                    balance: 0,
                    transactions: [],
                }));
            } else {
                throw new Error(result.Err);
            }

            // 2) balances for each labeled account
            const balances = await Promise.all(
                labeledAccounts.map(async (account) => {
                    try {
                        const balance = await ledgerActor.icrc1_balance_of({
                            owner: Principal.fromText(account.owner),
                            subaccount: [],
                        });
                        const decimals = await ledgerActor.icrc1_decimals();
                        // convert to ICP then to USD
                        return icpToUsd(Number(balance / BigInt(10 ** decimals)));
                    } catch {
                        return 0;
                    }
                })
            );

            const accountsWithBalances = labeledAccounts.map((acc, i) => ({
                ...acc,
                balance: balances[i],
            }));

            // 3) fetch transaction labels (single call) and map to string keys
            let customLabelsMap = new Map<string, string>();
            try {
                const labelsRes = await actor.get_transaction_labels();
                if ("Ok" in labelsRes) {
                    for (const rec of labelsRes.Ok) {
                        // rec.id is nat64 in backend; convert to string
                        customLabelsMap.set(String(rec.id), rec.label);
                    }
                }
            } catch {
                // ignore label fetch errors
                customLabelsMap = new Map<string, string>();
            }

            // 4) fetch index transactions per account
            const indexTransactionsPerAccount = await Promise.all(
                accountsWithBalances.map(async (account) => {
                    try {
                        const res = await indexActor.get_account_transactions({
                            max_results: BigInt(50),
                            start: [],
                            account: {
                                owner: Principal.fromText(account.owner),
                                subaccount: [],
                            },
                        });

                        const temp: Transaction[] = [];

                        if ("Ok" in res) {
                            for (const trans of res.Ok.transactions) {
                                if ("Transfer" in trans.transaction.operation) {
                                    const accountId = AccountIdentifier.fromPrincipal({
                                        principal: Principal.fromText(account.owner),
                                    }).toHex();

                                    const to = trans.transaction.operation.Transfer.to;
                                    const amount_e8s = trans.transaction.operation.Transfer.amount.e8s;
                                    const isReceived = to === accountId;
                                    const defaultLabel = isReceived ? "received" : "sent";

                                    // id (nat64) -> string
                                    const idStr = String(trans.id);

                                    // custom label if exists
                                    const customLabel = customLabelsMap.get(idStr);
                                    const finalLabel = customLabel ?? defaultLabel;

                                    // convert e8s -> ICP (float), then to USD via icpToUsd for consistency with balances.
                                    const icpAmount = Number(amount_e8s) / 1e8;
                                    const signedIcp = isReceived ? icpAmount : -icpAmount;
                                    const amountUsd = icpToUsd(signedIcp);

                                    const timestampNanos = trans.transaction.timestamp?.[0]?.timestamp_nanos ?? BigInt(0);
                                    const timestampMs = Math.trunc(Number(timestampNanos) / 1_000_000);

                                    temp.push({
                                        id: idStr,
                                        amount: amountUsd,
                                        timestamp_ms: timestampMs,
                                        account: account.label,
                                        label: finalLabel,
                                        isCustom: false,
                                    });
                                }
                            }
                        } else {
                            // ignore errors per account
                        }

                        return temp;
                    } catch {
                        return [];
                    }
                })
            );

            // 5) fetch custom transactions (user-created) and normalize
            let customTransactions: Transaction[] = [];
            try {
                const customRes = await actor.get_custom_transactions();
                if ("Ok" in customRes) {
                    for (const ct of customRes.Ok) {
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
    }, [actor, ledgerActor, indexActor]);

    const updateTransactionLabel = React.useCallback(
        async (transactionId: string, label: string) => {
            try {
                // transactionId is string here; backend expects nat64 for index tx labels
                // attempt to convert to BigInt if numeric
                const maybeId = /^\d+$/.test(transactionId) ? BigInt(transactionId) : (transactionId as any);
                const result = await actor.set_transaction_label({
                    transaction_id: maybeId,
                    label,
                });
                if ("Ok" in result) {
                    await fetchAccounts();
                    return true;
                } else {
                    throw new Error(result.Err);
                }
            } catch (e) {
                throw new Error(e instanceof Error ? e.message : "Failed to update label");
            }
        },
        [actor, fetchAccounts]
    );

    const createCustomTransaction = React.useCallback(
        async (tx: { timestamp_ms: number; label: string; amount: number }) => {
            try {
                // amount: dollars -> cents as nat64
                const amountCents = BigInt(Math.round(tx.amount * 100));
                const timestampNat = BigInt(Math.round(tx.timestamp_ms));
                const result = await actor.create_custom_transaction({
                    transaction: {
                        id: "", // backend can assign id if needed
                        timestamp_ms: timestampNat,
                        label: tx.label,
                        amount: amountCents,
                    },
                });
                if ("Ok" in result) {
                    await fetchAccounts();
                    return { ok: true, id: result.Ok };
                } else {
                    throw new Error(result.Err);
                }
            } catch (e) {
                throw new Error(e instanceof Error ? e.message : "Failed to create custom transaction");
            }
        },
        [actor, fetchAccounts]
    );

    const updateCustomTransaction = React.useCallback(
        async (tx: { id: string; timestamp_ms: number; label: string; amount: number }) => {
            try {
                const amountCents = BigInt(Math.round(tx.amount * 100));
                const timestampNat = BigInt(Math.round(tx.timestamp_ms));
                const result = await actor.update_custom_transaction({
                    id: tx.id,
                    timestamp_ms: timestampNat,
                    label: tx.label,
                    amount: amountCents,
                });
                if ("Ok" in result) {
                    await fetchAccounts();
                    return true;
                } else {
                    throw new Error(result.Err);
                }
            } catch (e) {
                throw new Error(e instanceof Error ? e.message : "Failed to update custom transaction");
            }
        },
        [actor, fetchAccounts]
    );

    const deleteCustomTransaction = React.useCallback(
        async (id: string) => {
            try {
                // backend delete_custom_transaction signature may expect nat64; try numeric conversion
                if (/^\d+$/.test(id)) {
                    const numeric = BigInt(id);
                    const result = await actor.delete_custom_transaction(numeric.toString());
                    if ("Ok" in result) {
                        await fetchAccounts();
                        return true;
                    } else {
                        throw new Error(result.Err);
                    }
                } else {
                    // if id is non-numeric, try passing as-is (some backends may accept text id via overloaded method)
                    const result = await actor.delete_custom_transaction(id as any);
                    if ("Ok" in result) {
                        await fetchAccounts();
                        return true;
                    } else {
                        throw new Error(result.Err);
                    }
                }
            } catch (e) {
                throw new Error(e instanceof Error ? e.message : "Failed to delete custom transaction");
            }
        },
        [actor, fetchAccounts]
    );

    const addAccount = React.useCallback(
        async (owner: string, label: string) => {
            try {
                await actor.create_labeled_account({
                    label,
                    account: {
                        owner: Principal.fromText(owner),
                        subaccount: [],
                    },
                });
                await fetchAccounts();
                return true;
            } catch (e) {
                throw new Error(e instanceof Error ? e.message : "Failed to add account");
            }
        },
        [actor, fetchAccounts]
    );

    const removeAccount = React.useCallback(
        async (owner: string) => {
            try {
                await actor.delete_labeled_account({
                    owner: Principal.fromText(owner),
                    subaccount: [],
                });
                await fetchAccounts();
                return true;
            } catch (e) {
                throw new Error(e instanceof Error ? e.message : "Failed to remove account");
            }
        },
        [actor, fetchAccounts]
    );

    React.useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

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