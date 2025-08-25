
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
    wallet: "Wallet Address Management",
    transactions: "Transaction Dashboard",
    financial_report: "Financial Report",
    market_report: "Market Reports",
};

export const SENT_LABEL = "On-chain Payment";
export const RECEIVED_LABEL = "On-chain Revenue";

export const isSendLabel = (label: string) => {
    const lower = label.toLowerCase();
    return lower === "payment" || lower === "purchase" || lower === "fee" || lower === "sent" || lower === "transfer";
}

export const isReceiveLabel = (label: string) => {
    const lower = label.toLowerCase();
    return lower === "refund" || lower === "reimbursement" || lower === "received";
}