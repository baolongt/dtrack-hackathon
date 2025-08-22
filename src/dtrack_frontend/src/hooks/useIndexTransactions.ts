import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { icpToUsd } from "../lib/utils";
import { LabeledAccount, Transaction } from "./types";
import IndexService from "../services/index.service";

// indexService should implement getAccountTransactions(ownerText, subaccount?, maxResults?)
export async function getIndexTransactionsPerAccount(
    accountsWithBalances: LabeledAccount[],
    indexService: IndexService,
    customLabelsMap: Map<string, string>
): Promise<Transaction[][]> {
    return Promise.all(
        accountsWithBalances.map(async (account) => {
            try {
                const res = await indexService.getAccountTransactions(account.owner, [], BigInt(50));

                const temp: Transaction[] = [];

                if (res && Array.isArray(res.transactions ? res.transactions : res)) {
                    const transactions = res.transactions ?? res;
                    for (const trans of transactions) {
                        if ("Transfer" in trans.transaction.operation) {
                            const accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(account.owner) }).toHex();

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
}
