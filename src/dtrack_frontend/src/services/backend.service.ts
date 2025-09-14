import { Actor, ActorConfig, ActorSubclass, Agent, HttpAgentOptions, Identity } from "@dfinity/agent";
import { CANISTER_ID_DTRACK_BACKEND, HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";
import { _SERVICE, CreateCustomTransactionRequest, CreateLabeledAccountRequest, CustomTransaction, idlFactory, SetTransactionLabelRequest, StoredAccount } from "@/generated/dtrack_backend/dtrack_backend.did";
import { getAgent } from "@/lib/utils";

export const createActor = (canisterId: string, options: {
    /**
     * @see {@link Agent}
     */
    agent?: Agent;
    /**
     * @see {@link HttpAgentOptions}
     */
    agentOptions?: HttpAgentOptions;
    /**
     * @see {@link ActorConfig}
     */
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

// BackendService: singleton wrapper around the backend actor to centralize call handling
export class BackendService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: BackendService | null = null;
    // keep track of the identity used to create the actor so we can recreate when it changes

    static getInstance(identity?: Identity) {
        // recreate actor if identity changed (or instance not present)
        if (!BackendService.instance) {
            const actor = createActor(CANISTER_ID_DTRACK_BACKEND, {
                agent: getAgent(identity)
            });
            if (!actor) throw new Error("BackendService not initialized: provide an actor when first calling getInstance");
            BackendService.instance = new BackendService(actor);
        }
        return BackendService.instance;
    }

    async getLabeledAccounts() {
        const res = await this.actor.get_labeled_accounts();
        console.log("get_labeled_accounts response:", res);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "get_labeled_accounts failed");
    }

    async getCustomTransactions() {
        const res = await this.actor.get_custom_transactions();
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "get_custom_transactions failed");
    }

    async getTransactionLabels() {
        const res = await this.actor.get_transaction_labels();
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "get_transaction_labels failed");
    }

    async setTransactionLabel(transaction_id: string | bigint, label: string) {
        const maybeId = typeof transaction_id === "string" && /^\d+$/.test(transaction_id) ? BigInt(transaction_id) : transaction_id;
        const payload: SetTransactionLabelRequest
            = { transaction_id: maybeId as bigint, label };
        const res = await this.actor.set_transaction_label(payload);
        console.log("set_transaction_label response:", res);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "set_transaction_label failed");
    }

    async createCustomTransaction(transaction: CustomTransaction) {
        const payload: CreateCustomTransactionRequest = { transaction };
        const res = await this.actor.create_custom_transaction(payload);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "create_custom_transaction failed");
    }

    async updateCustomTransaction(payload: CustomTransaction) {
        const res = await this.actor.update_custom_transaction(payload);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "update_custom_transaction failed");
    }

    async deleteCustomTransaction(id: string | bigint) {
        const arg = typeof id === "string" && /^\d+$/.test(id) ? id : id;
        const res = await this.actor.delete_custom_transaction(arg as string);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "delete_custom_transaction failed");
    }

    async createLabeledAccount(payload: CreateLabeledAccountRequest) {
        const res = await this.actor.create_labeled_account(payload);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "create_labeled_account failed");
    }

    async deleteLabeledAccount(payload: StoredAccount) {
        const res = await this.actor.delete_labeled_account(payload);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "delete_labeled_account failed");
    }

    async addLabel(label: string) {
        const res = await this.actor.add_label(label);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "add_label failed");
    }

    async getLabels() {
        return await this.actor.get_labels()
    }

    async getProducts() {
        const res = await (this.actor as any).get_products();
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "get_products failed");
    }

    async addProduct(payload: { product: string }) {
        const res = await (this.actor as any).add_product(payload);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "add_product failed");
    }

    async removeProduct(product: string) {
        const res = await (this.actor as any).remove_product(product);
        if ("Ok" in res) return res.Ok;
        throw new Error(res.Err || "remove_product failed");
    }
}

export default BackendService;
