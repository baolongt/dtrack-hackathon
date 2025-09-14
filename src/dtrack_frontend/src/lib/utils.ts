import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isSendLabel, RECEIVED_LABEL, ROUTE_VIEW_MAP, SENT_LABEL } from "./const"
import { Account, TransactionWithId } from "@dfinity/ledger-icp"
import { fromNullable } from "@dfinity/utils"
import { encodeIcrcAccount, IcrcAccount } from "@dfinity/ledger-icrc"
import { Transaction } from "@/hooks/types"
import { CANISTER_ID_ICP_LEDGER_CANISTER, HOST, SHOULD_FETCH_ROOT_KEY } from "./env"
import { HttpAgent, Identity } from "@dfinity/agent"

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
  if (ledger_id === CANISTER_ID_ICP_LEDGER_CANISTER) return amount * 5; // ICP
  // Fallback: return amount unchanged for unknown ledgers
  return amount
}

// Convert a token amount to a USD amount and apply sign based on a human label.
// - ledger_id: the ledger canister id used by getTokenPrice
// - label: one of 'received'|'sent'|'mint'|'burn'|'approve' or variants like 'approve (...)'
// - tokenAmount: the token amount in token units (e.g. ICP), always positive
// Returns: signed USD amount (approve -> 0)
export const convert = (
  ledger_id: string,
  label: string,
  tokenAmount: number
): number => {
  // Compute USD price for the absolute token amount
  const usd = getTokenPrice(ledger_id, Math.abs(tokenAmount))

  // Outgoing labels should be negative
  if (isSendLabel(label)) return -usd

  // received, mint, and any other labels default to positive
  return usd
}

// Derive a simple view key from a pathname. Used by Header and Sidebar.
export const getActiveViewFromPath = (pathname: string) => {
  return ROUTE_VIEW_MAP[pathname] || "";
};

// Convert index canister TransactionWithId to frontend Transaction
// - `indexTx` is the object returned by the index canister (with `id` and `transaction`)
// - `accountLabel` is the human label for the account (used in the frontend Transaction.account)
// - `accountIdStr` is the encoded account identifier string used to check incoming/outgoing transfers
// - `ledger_id` is passed to getTokenPrice to convert token amount to USD
export const convertIndexTxToFrontend = (
  indexTx: TransactionWithId,
  accountLabel: string,
  accountIdStr: string,
  ledger_id = CANISTER_ID_ICP_LEDGER_CANISTER
): Transaction | null => {
  try {
    const tx = indexTx.transaction
    const id = String(indexTx.id)

    console.log('convertIndexTxToFrontend - processing tx:', tx)

    // Transfer
    if ('Transfer' in tx.operation) {
      const transfer = tx.operation.Transfer
      const isReceived = transfer.to === accountIdStr
      const icpAmount = Number(transfer.amount.e8s) / 1e8
      const signedIcp = isReceived ? icpAmount : -icpAmount
      const amountUsd = getTokenPrice(ledger_id, signedIcp)
      const timestampNanos = tx.timestamp?.[0]?.timestamp_nanos ?? BigInt(0)
      const timestampMs = Math.trunc(Number(timestampNanos) / 1_000_000)

      return {
        id,
        amount: amountUsd,
        timestamp_ms: timestampMs,
        account: accountLabel,
        label: isReceived ? RECEIVED_LABEL : SENT_LABEL,
      }
    }

    // Mint (tokens created to an account)
    if ('Mint' in tx.operation) {
      const mint = tx.operation.Mint
      const icpAmount = Number(mint.amount.e8s) / 1e8
      const amountUsd = getTokenPrice(ledger_id, icpAmount)
      const timestampNanos = tx.timestamp?.[0]?.timestamp_nanos ?? BigInt(0)
      const timestampMs = Math.trunc(Number(timestampNanos) / 1_000_000)
      console.log('convertIndexTxToFrontend - processing Mint operation');
      return {
        id,
        amount: amountUsd,
        timestamp_ms: timestampMs,
        account: accountLabel,
        label: RECEIVED_LABEL,
      }
    }

    // Burn (tokens destroyed from an account) — treat as outgoing
    if ('Burn' in tx.operation) {
      const burn = tx.operation.Burn
      const isFrom = burn.from === accountIdStr
      if (!isFrom) return null
      const icpAmount = Number(burn.amount.e8s) / 1e8
      const signedIcp = -icpAmount
      const amountUsd = getTokenPrice(ledger_id, signedIcp)
      const timestampNanos = tx.timestamp?.[0]?.timestamp_nanos ?? BigInt(0)
      const timestampMs = Math.trunc(Number(timestampNanos) / 1_000_000)
      return {
        id,
        amount: amountUsd,
        timestamp_ms: timestampMs,
        account: accountLabel,
        label: 'burn',
      }
    }

    // Approve (allowance change) — not a transfer; show allowance info and amount 0
    if ('Approve' in tx.operation) {
      const ap = tx.operation.Approve
      const isFrom = ap.from === accountIdStr
      if (!isFrom) return null
      const allowance = ap.allowance?.e8s ? Number(ap.allowance.e8s) / 1e8 : 0
      const allowanceUsd = allowance ? getTokenPrice(ledger_id, allowance) : 0
      const timestampNanos = tx.timestamp?.[0]?.timestamp_nanos ?? BigInt(0)
      const timestampMs = Math.trunc(Number(timestampNanos) / 1_000_000)
      const label = allowance ? `approve (allowance ${allowanceUsd >= 0 ? '$' + allowanceUsd.toFixed(2) : String(allowanceUsd)})` : 'approve'
      return {
        id,
        amount: 0,
        timestamp_ms: timestampMs,
        account: accountLabel,
        label,
      }
    }

    console.log("reach here")
    return null
  } catch (e) {
    console.error('convertIndexTxToFrontend error', e)
    return null
  }
}

export const getAgent = (identity?: Identity | undefined) => {
  const agent = HttpAgent.createSync({
    identity,
    host: HOST,
    shouldFetchRootKey: SHOULD_FETCH_ROOT_KEY,
  });
  return agent;
};
