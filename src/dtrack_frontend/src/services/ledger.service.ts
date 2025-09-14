import { Actor, ActorConfig, ActorSubclass, Agent, HttpAgentOptions, Identity } from "@dfinity/agent";
import { _SERVICE, Account as LedgerAccount } from "@/generated/icp_ledger_canister/icp_ledger_canister.did";
import { idlFactory as ledgerIdlFactory } from "@/generated/icp_ledger_canister/icp_ledger_canister.did";
import { CANISTER_ID_ICP_LEDGER_CANISTER, HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";
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
    return Actor.createActor(ledgerIdlFactory, {
        agent: options.agent,
        canisterId,
        ...options.actorOptions,
    });
};
export class LedgerService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: LedgerService | null = null;

    static getInstance(ledger_id: string = CANISTER_ID_ICP_LEDGER_CANISTER, identity?: Identity) {
        if (!LedgerService.instance) {
            const actor = createActor(ledger_id, {
                agent: getAgent(identity)
            });
            if (!actor) throw new Error("LedgerService not initialized: provide an actor when first calling getInstance");
            LedgerService.instance = new LedgerService(actor);
        }
        return LedgerService.instance;
    }

    async balanceOf(account: Account): Promise<bigint> {
        const res = await this.actor.icrc1_balance_of(account);
        return res;
    }

    async decimals(): Promise<number> {
        return await this.actor.icrc1_decimals();
    }
}

export default LedgerService;
