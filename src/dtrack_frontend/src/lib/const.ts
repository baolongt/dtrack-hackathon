
export const ROUTE_VIEW_MAP: Record<string, string> = {
    "/": "home",
    "/accounts": "wallet",
    "/wallet": "wallet",
    "/history": "transactions",
    "/transactions": "transactions",
    "/financial-report": "financial_report",
    "/market-report": "market_report",
};

export const VIEW_TITLES: Record<string, string> = {
    home: "Dashboard Overview",
    wallet: "Account Management",
    transactions: "Transaction Dashboard",
    financial_report: "Financial Report",
    market_report: "Market Reports",
};

export const SENT_LABEL = "On-chain Payment";
export const RECEIVED_LABEL = "On-chain Revenue";

export const INDEX_LABELS = [SENT_LABEL, RECEIVED_LABEL];

export const TX_LABELS = ["Subscription", "Invoice Payment", "Refund", "Investment", "Crowdfund", "Onchain-grant"];

export const CUSTOM_TX_LABELS = ["Subscription", "Invoice Payment", "Refund", "Investment", "Crowdfund"];

export const isSendLabel = (label: string) => {
    const lower = label.toLowerCase();
    const arr = ["On-chain Payment", "Refund", "Subscription", "Invoice Payment"];
    return !arr.map((s) => s.toLowerCase()).includes(lower);
}



