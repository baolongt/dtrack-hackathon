import { ActorSubclass, Identity } from "@dfinity/agent";
import { _SERVICE, GetAccountIdentifierTransactionsResponse } from "../../../declarations/icp_index_canister/icp_index_canister.did";
import { createActor as indexCreateActor } from "../../../declarations/icp_index_canister";
import { HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";
import { Account } from "@dfinity/ledger-icp";
export class IndexService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: IndexService | null = null;
    static lastIdentity: Identity | undefined = undefined;

    static getInstantce(canister_id: string, identity?: Identity) {
        if (!IndexService.instance || IndexService.lastIdentity !== identity) {
            const actor = indexCreateActor(canister_id, {
                agentOptions: {
                    host: HOST,
                    shouldFetchRootKey: SHOULD_FETCH_ROOT_KEY,
                    identity,
                },
            });
            if (!actor) throw new Error("IndexService not initialized: provide an actor when first calling getInstance");
            IndexService.instance = new IndexService(actor);
            IndexService.lastIdentity = identity;
        }
        return IndexService.instance;
    }

    async getAccountTransactions(account: Account, maxResults: number): Promise<GetAccountIdentifierTransactionsResponse> {
        const res = await this.actor.get_account_transactions({
            max_results: BigInt(maxResults),
            start: [],
            account,
        });
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
