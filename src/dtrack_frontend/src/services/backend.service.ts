import { ActorSubclass, Identity } from "@dfinity/agent";
import { _SERVICE, CustomTransaction, CreateCustomTransactionRequest, CreateLabeledAccountRequest, Account, SetTransactionLabelRequest, StoredAccount } from "../../../declarations/dtrack_backend/dtrack_backend.did";
import { canisterId, createActor } from "../../../declarations/dtrack_backend";
import { HOST, SHOULD_FETCH_ROOT_KEY } from "@/lib/env";

// BackendService: singleton wrapper around the backend actor to centralize call handling
export class BackendService {
    private actor: ActorSubclass<_SERVICE>;
    private constructor(actor: ActorSubclass<_SERVICE>) {
        this.actor = actor;
    }

    static instance: BackendService | null = null;
    // keep track of the identity used to create the actor so we can recreate when it changes
    static lastIdentity: Identity | undefined = undefined;

    static getInstance(identity?: Identity) {
        // recreate actor if identity changed (or instance not present)
        if (!BackendService.instance || BackendService.lastIdentity !== identity) {
            const actor = createActor(canisterId, {
                agentOptions: {
                    host: HOST,
                    shouldFetchRootKey: SHOULD_FETCH_ROOT_KEY,
                    identity,
                },
            });
            if (!actor) throw new Error("BackendService not initialized: provide an actor when first calling getInstance");
            BackendService.instance = new BackendService(actor);
            BackendService.lastIdentity = identity;
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
        const payload: SetTransactionLabelRequest = { transaction_id: maybeId as bigint, label };
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
