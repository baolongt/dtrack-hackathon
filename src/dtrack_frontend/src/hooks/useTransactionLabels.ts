import BackendService from "../services/backend.service";

export async function getTransactionLabelsMap(backendService: BackendService): Promise<Map<string, string>> {
    let customLabelsMap = new Map<string, string>();
    try {
        const labelsRes = await backendService.getTransactionLabels();
        if (Array.isArray(labelsRes)) {
            for (const rec of labelsRes) {
                // rec.id is nat64 in backend; convert to string
                customLabelsMap.set(String(rec.id), rec.label);
            }
        }
    } catch {
        // ignore label fetch errors
        customLabelsMap = new Map<string, string>();
    }
    return customLabelsMap;
}
