// Centralized environment constants for network configuration
const isLocal = process.env.DFX_NETWORK === "local";

export const HOST = isLocal ? "http://127.0.0.1:8000" : "https://ic0.app";
export const SHOULD_FETCH_ROOT_KEY = isLocal;
export const identityProviderHost = isLocal
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:8000`
    : "https://identity.ic0.app";

export default {
    host: HOST,
    shouldFetchRootKey: SHOULD_FETCH_ROOT_KEY,
    identityProviderHost,
};
