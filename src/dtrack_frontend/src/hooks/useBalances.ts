import { Principal } from "@dfinity/principal";
import { icpToUsd } from "../lib/utils";
import { LabeledAccount } from "./types";
import LedgerService from "../services/ledger.service";

// ledgerService should be a LedgerService instance
export async function getBalancesForAccounts(accounts: LabeledAccount[], ledgerService: LedgerService): Promise<number[]> {
    return Promise.all(
        accounts.map(async (account) => {
            try {
                const balance = await ledgerService.balanceOf(account.owner, []);
                const decimals = await ledgerService.decimals();
                // convert to ICP then to USD
                return icpToUsd(Number(balance / BigInt(10 ** decimals)));
            } catch {
                return 0;
            }
        })
    );
}
