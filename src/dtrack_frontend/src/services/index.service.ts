import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { _SERVICE, Account as IndexAccount, GetAccountTransactionsArgs, GetAccountIdentifierTransactionsResponse } from "../../../declarations/icp_index_canister/icp_index_canister.did";
import { fromNullable } from "@dfinity/utils";

export class IndexService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: IndexService | null = null;

    static getInstance(actor?: ActorSubclass<_SERVICE>) {
        if (!IndexService.instance) {
            if (!actor) throw new Error("IndexService not initialized: provide an actor when first calling getInstance");
            IndexService.instance = new IndexService(actor);
        }
        return IndexService.instance;
    }

    async getAccountTransactions(ownerText: string, subaccount?: Uint8Array | number[] | null, maxResults: bigint = BigInt(50)): Promise<GetAccountIdentifierTransactionsResponse> {
        const owner = Principal.fromText(ownerText);
        const account: IndexAccount = { owner, subaccount: subaccount ? [Array.from(subaccount as Uint8Array | number[])] : [] };
        const res = await this.actor.get_account_transactions({
            max_results: maxResults,
            start: [],
            account,
        } as GetAccountTransactionsArgs);
        if ("Ok" in res) return res.Ok;
        throw new Error((res as any).Err || "get_account_transactions failed");
    }

    async getTransactionById(id: string | bigint) {
        // index canister here doesn't expose get_transaction in its candid; keep runtime guard
        if (typeof (this.actor as any).get_transaction === "function") {
            const arg = typeof id === "string" && /^\d+$/.test(id) ? BigInt(id) : id;
            const res = await (this.actor as any).get_transaction(arg);
            if ("Ok" in res) return res.Ok;
            throw new Error((res as any).Err || "get_transaction failed");
        }
        throw new Error("get_transaction not implemented on index actor");
    }
}

export default IndexService;
