import { Actor, ActorSubclass, Identity, Agent, ActorConfig, HttpAgentOptions } from "@dfinity/agent";
import { _SERVICE, GetAccountIdentifierTransactionsResponse, idlFactory } from "@/generated/icp_index_canister/icp_index_canister.did";
import { CANISTER_ID_ICP_INDEX_CANISTER, HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";
import { Account } from "@dfinity/ledger-icp";
import { getAgent } from "@/lib/utils";

export const createActor = (canisterId: string, options: {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
}): ActorSubclass<_SERVICE> => {
    if (options.agent && options.agentOptions) {
        console.warn(
            "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
        );
    }
    // Creates an actor with using the candid interface and the HttpAgent
    return Actor.createActor(idlFactory, {
        agent: options.agent,
        canisterId,
        ...options.actorOptions,
    });
};
export class IndexService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: IndexService | null = null;

    static getInstance(canister_id: string = CANISTER_ID_ICP_INDEX_CANISTER, identity?: Identity) {
        if (!IndexService.instance) {
            const actor = createActor(canister_id, {
                agent: getAgent(identity)
            });
            if (!actor) throw new Error("IndexService not initialized: provide an actor when first calling getInstance");
            IndexService.instance = new IndexService(actor);
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
