import { LabeledAccount } from "./types";
import BackendService from "../services/backend.service";

// Accepts a BackendService instance
export async function getLabeledAccounts(backendService: BackendService): Promise<LabeledAccount[]> {
    const result = await backendService.getLabeledAccounts();
    let labeledAccounts: LabeledAccount[] = [];

    if (Array.isArray(result)) {
        labeledAccounts = result.map((addr: any) => ({
            owner: addr.account.owner.toText(),
            label: addr.label,
            balance: 0,
            transactions: [],
        }));
    } else {
        throw new Error("get_labeled_accounts returned unexpected result");
    }

    return labeledAccounts;
}
