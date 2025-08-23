import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ROUTE_VIEW_MAP } from "./const"
import { Account, AccountIdentifier, SubAccount } from "@dfinity/ledger-icp"
import { fromNullable, toNullable } from "@dfinity/utils"
import { encodeIcrcAccount, IcrcAccount } from "@dfinity/ledger-icrc"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// truncated principal, e.g. "rrkah-fqaaa-aaaaa-aaaaq-cai" -> "rrkahf...aq-cai"
export const truncatePrincipal = (principal: string) => {
  if (principal.length <= 11) return principal;
  return `${principal.slice(0, 7)}...${principal.slice(-4)}`;
}

// mapping between two packages, it is the same
export const toIcrcAccount = (acc: Account): IcrcAccount => {
  let normalSubaccount = fromNullable(acc.subaccount) ?? new Uint8Array(32).fill(0);
  return {
    owner: acc.owner,
    subaccount: normalSubaccount
  }
}

// truncated account id string, e.g. "f4a3b2c1d0e9..." -> "f4a3b2...0e9"
export const truncateAccount = (acc: Account) => {
  let accountIdStr = encodeIcrcAccount(toIcrcAccount(acc));
  return `${accountIdStr.slice(0, 7)}...${accountIdStr.slice(-4)}`
}

export const getTokenPrice = (ledger_id: string, amount: number): number => {
  if (ledger_id === "ryjl3-tyaaa-aaaaa-aaaba-cai") return amount * 5; // ICP
  // Fallback: return amount unchanged for unknown ledgers
  return amount
}

// Derive a simple view key from a pathname. Used by Header and Sidebar.
export const getActiveViewFromPath = (pathname: string) => {
  return ROUTE_VIEW_MAP[pathname] || "";
};