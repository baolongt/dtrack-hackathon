// Centralized environment constants for network configuration
const isLocal = process.env.DFX_NETWORK === "local";

export const host = isLocal ? "http://127.0.0.1:8000" : "https://ic0.app";
export const shouldFetchRootKey = isLocal;

console.log("test", process.env.CANISTER_ID_INTERNET_IDENTITY)

export const identityProviderHost = isLocal
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:8000`
    : "https://identity.ic0.app";

export default {
    host,
    shouldFetchRootKey,
    identityProviderHost,
};
