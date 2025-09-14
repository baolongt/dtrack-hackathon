// Centralized environment constants for network configuration
const isLocal = process.env.DFX_NETWORK === "local";

export const HOST = isLocal ? "http://127.0.0.1:8000" : "https://icp0.io";
export const SHOULD_FETCH_ROOT_KEY = isLocal;
export const IDENTITY_PROVIDER_HOST = isLocal
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:8000`
    : "https://id.ai";


export const CANISTER_ID_DTRACK_BACKEND = "hca6p-mqaaa-aaaak-qulwq-cai";
export const CANISTER_ID_ICP_LEDGER_CANISTER = "ryjl3-tyaaa-aaaaa-aaaba-cai"
export const CANISTER_ID_ICP_INDEX_CANISTER = "qhbym-qaaaa-aaaaa-aaafq-cai"