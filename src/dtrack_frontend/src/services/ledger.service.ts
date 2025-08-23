import { ActorSubclass, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { _SERVICE, Account as LedgerAccount } from "../../../declarations/icp_ledger_canister/icp_ledger_canister.did";
import { canisterId as ledgerCanisterId, createActor as ledgerCreateActor } from "../../../declarations/icp_ledger_canister";
import { HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";
export class LedgerService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: LedgerService | null = null;

    static getInstantce(identity?: Identity) {
        if (!LedgerService.instance) {
            const actor = ledgerCreateActor(ledgerCanisterId, {
                agentOptions: {
                    fetch,
                    host: HOST,
                    shouldFetchRootKey: SHOULD_FETCH_ROOT_KEY,
                    identity
                },
            });
            if (!actor) throw new Error("LedgerService not initialized: provide an actor when first calling getInstance");
            LedgerService.instance = new LedgerService(actor);
        }
        return LedgerService.instance;
    }

    async balanceOf(ownerText: string, subaccount?: Uint8Array | number[] | null): Promise<bigint> {
        const owner = Principal.fromText(ownerText);
        const account: LedgerAccount = { owner, subaccount: subaccount ? [subaccount as Uint8Array | number[]] : [] };
        const res = await this.actor.icrc1_balance_of(account);
        return res;
    }

    async decimals(): Promise<number> {
        return await this.actor.icrc1_decimals();
    }
}

export default LedgerService;
