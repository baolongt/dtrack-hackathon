import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { _SERVICE, Account as LedgerAccount } from "../../../declarations/icp_ledger_canister/icp_ledger_canister.did";

export class LedgerService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: LedgerService | null = null;

    static getInstance(actor?: ActorSubclass<_SERVICE>) {
        if (!LedgerService.instance) {
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
