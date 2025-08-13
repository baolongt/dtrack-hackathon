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
    transactions: Transaction[],
}

export interface Transaction {
    id: bigint;
    amount: bigint;
    timestamp_nanos: bigint;
    account: string;
}

export function useAccounts() {
    const actor = React.useMemo(() =>
        createActor(canisterId, {
            agentOptions: {
                fetch,
                host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:8080' : 'https://ic0.app',
                shouldFetchRootKey: process.env.DFX_NETWORK === 'local' ? true : false,
            }
        }), []
    );

    const ledgerActor = React.useMemo(() =>
        ledgerCreateActor(ledgerCanisterId, {
            agentOptions: {
                fetch,
                host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:8080' : 'https://ic0.app',
                shouldFetchRootKey: process.env.DFX_NETWORK === 'local' ? true : false,
            }
        }), []
    );

    const indexActor = React.useMemo(() =>
        indexCreateActor(indexCanisterId, {
            agentOptions: {
                fetch,
                host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:8080' : 'https://ic0.app',
                shouldFetchRootKey: process.env.DFX_NETWORK === 'local' ? true : false,
            }
        }), []
    );

    const [accounts, setAccounts] = React.useState<LabeledAccount[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchAccounts = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actor.get_labeled_accounts();
            let accounts: LabeledAccount[] = [];

            if ("Ok" in result) {
                accounts = result.Ok.map(addr => ({
                    owner: addr.account.owner.toText(),
                    label: addr.label,
                    balance: 0,
                    transactions: [],
                }));
            } else {
                throw new Error(result.Err);
            }

            const balances = await Promise.all(
                accounts.map(async (account) => {
                    try {
                        const balance = await ledgerActor.icrc1_balance_of({
                            owner: Principal.fromText(account.owner),
                            subaccount: [],
                        });
                        const decimals = await ledgerActor.icrc1_decimals();
                        return icpToUsd(Number(balance / BigInt(10 ** decimals)));
                    } catch {
                        return 0;
                    }
                })
            );

            const accountsWithBalances = accounts.map((acc, i) => ({
                ...acc,
                balance: balances[i],
            }));

            const transactions = await Promise.all(
                accountsWithBalances.map(async (account) => {
                    try {
                        const result = await indexActor.get_account_transactions({
                            max_results: BigInt(50),
                            start: [],
                            account: {
                                owner: Principal.fromText(account.owner),
                                subaccount: []
                            }
                        })

                        let temp : Transaction[] = [];

                        if ("Ok" in result) {
                            for (const trans of result.Ok.transactions) {
                                if ('Transfer' in trans.transaction.operation) {

                                    const accountId = AccountIdentifier.fromPrincipal({
                                        principal: Principal.fromText(account.owner),
                                    }).toHex()

                                    let isReceived = trans.transaction.operation.Transfer.to === accountId

                                    temp.push({
                                        id: trans.id,
                                        amount: BigInt(isReceived ? 1:-1)* trans.transaction.operation.Transfer.amount.e8s / BigInt(100000000),
                                        timestamp_nanos: trans.transaction.timestamp[0]?.timestamp_nanos ?? BigInt(0),
                                        account: account.label,
                                    })
                                }
                            }

                            return temp
                        } else {
                            throw new Error(result.Err.message);
                        }
                    } catch {
                        return []
                    }
                })
            );

             const accountsWithTransactions = accountsWithBalances.map((acc, i) => ({
                ...acc,
                transactions: transactions[i],
            }));


            setAccounts(accountsWithTransactions);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch accounts');
        } finally {
            setIsLoading(false);
        }
    }, [actor, ledgerActor]);

    const addAccount = React.useCallback(async (owner: string, label: string) => {
        try {
            await actor.create_labeled_account({
                label,
                account: {
                    owner: Principal.fromText(owner),
                    subaccount: [],
                }
            });
            await fetchAccounts(); // Refresh the accounts list
            return true;
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : 'Failed to add account');
        }
    }, [actor, fetchAccounts]);

    const removeAccount = React.useCallback(async (owner: string) => {
        try {
            await actor.delete_labeled_account({
                owner: Principal.fromText(owner),
                subaccount: [],
            });
            await fetchAccounts(); // Refresh the accounts list
            return true;
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : 'Failed to remove account');
        }
    }, [actor, fetchAccounts]);

    React.useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    return {
        accounts,
        isLoading,
        error,
        fetchAccounts,
        addAccount,
        removeAccount
    };
}