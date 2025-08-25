import { ActorSubclass, Identity } from "@dfinity/agent";
import { _SERVICE, Account as LedgerAccount } from "../../../declarations/icp_ledger_canister/icp_ledger_canister.did";
import { createActor as ledgerCreateActor } from "../../../declarations/icp_ledger_canister";
import { HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";
import { Account } from "@dfinity/ledger-icp";
export class LedgerService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: LedgerService | null = null;
    static lastIdentity: Identity | undefined = undefined;

    static getInstantce(ledger_id: string, identity?: Identity) {
        if (!LedgerService.instance || LedgerService.lastIdentity !== identity) {
            const actor = ledgerCreateActor(ledger_id, {
                agentOptions: {
                    host: HOST,
                    shouldFetchRootKey: SHOULD_FETCH_ROOT_KEY,
                    identity,
                },
            });
            if (!actor) throw new Error("LedgerService not initialized: provide an actor when first calling getInstance");
            LedgerService.instance = new LedgerService(actor);
            LedgerService.lastIdentity = identity;
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
