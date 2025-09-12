import { create } from 'zustand'
import { ICRC1Account, LabeledAccount, Transaction } from '../hooks/types'
import BackendService from '../services/backend.service'
import LedgerService from '../services/ledger.service'
import IndexService from '../services/index.service'

import { Account } from '@dfinity/ledger-icp'
import { decodeIcrcAccount, encodeIcrcAccount } from '@dfinity/ledger-icrc'
import { toNullable } from '@dfinity/utils'
import { convertIndexTxToFrontend, getTokenPrice, toIcrcAccount } from '../lib/utils'
import { Identity } from '@dfinity/agent'

// helper: is the stored account an Icrc1 on-ledger account
const isStoredIcrc1 = (acc: LabeledAccount): acc is ICRC1Account => {
    return !!acc.account && typeof acc.account === 'object' && 'Icrc1' in (acc.account as any)
}

// helper: produce a stable key string for a StoredAccount (Icrc1 -> encoded account, Offchain -> value)
const storedAccountKey = (acc: LabeledAccount): string => {
    if (isStoredIcrc1(acc)) {
        return encodeIcrcAccount(toIcrcAccount(acc.account.Icrc1))
    }
    if (acc.account && typeof acc.account === 'object' && 'Offchain' in (acc.account as any)) {
        return (acc.account as any).Offchain
    }
    return ''
}

interface AccountStore {
    labeledAccounts: LabeledAccount[]
    customTransactions: Transaction[]
    identity: Identity | null
    isLoadingLabeled: boolean
    isLoadingBalances: boolean
    isLoadingIndex: boolean
    error: string | null

    // setters
    setIdentity(identity: Identity | null): void

    // canister interactions
    fetchLabeledAccounts(): Promise<void>
    fetchBalances(): Promise<void>
    fetchIndexTransactions(): Promise<void>
    fetchCustomAccount(): Promise<void>
    fetchTransactionLabels(): Promise<void>
    fetchAll(): Promise<void>
    updateTransactionLabel(transactionId: string, label: string): Promise<boolean>
    createCustomTransaction(tx: { timestamp_ms: number; label: string; amount: number; account: string }): Promise<{ ok: true; id: string } | never>
    updateCustomTransaction(tx: { id: string; timestamp_ms: number; label: string; amount: number; account: string }): Promise<boolean>
    deleteCustomTransaction(id: string): Promise<boolean>
    addAccount(account: string, label: string, product?: string): Promise<boolean>
    removeAccount(account: string): Promise<boolean>
    addOffchainAccount(account: string, label: string, product?: string): Promise<boolean>
    removeOffchainAccount(account: string): Promise<boolean>
    clear(): void
}

export const useAccountStore = create<AccountStore>((set, get) => ({
    labeledAccounts: [],
    customTransactions: [],
    identity: null,
    isLoadingLabeled: false,
    isLoadingBalances: false,
    isLoadingIndex: false,
    error: null,

    setIdentity(identity: Identity | null) {
        set({ identity })
        get().clear()
    },

    async fetchLabeledAccounts() {
        let backendService = BackendService.getInstance(get().identity || undefined)
        set({ isLoadingLabeled: true, error: null })
        try {
            const res = await backendService.getLabeledAccounts();
            const labeled: LabeledAccount[] = res.map((item) => ({
                account: item.account,
                label: item.label,
                product: item.product || '',
                balance: 0,
                transactions: [],
            }))

            set({ labeledAccounts: labeled })
        } catch (e) {
            set({ error: e instanceof Error ? e.message : String(e) })
        } finally {
            set({ isLoadingLabeled: false })
        }
    },

    async fetchTransactionLabels() {
        let backendService = BackendService.getInstance(get().identity || undefined)
        try {
            const res = await backendService.getTransactionLabels();
            // res is an array of { id: bigint, label: string }
            // build a string-keyed map so we can match against frontend tx.id (which is a string)
            const labelMap: Record<string, string> = {} as Record<string, string>
            (res || []).forEach((rec: any) => {
                try {
                    const idStr = String(rec.id)
                    labelMap[idStr] = rec.label
                } catch {
                    // ignore malformed entries
                }
            })

            // map labels onto existing labeledAccounts' transactions
            const currentLabeled = get().labeledAccounts || []
            const updatedLabeled = currentLabeled.map((acc) => {
                const updatedTxs = (acc.transactions || []).map((tx) => {
                    const mapped = labelMap[tx.id]
                    if (mapped && mapped !== tx.label) {
                        return { ...tx, label: mapped }
                    }
                    return tx
                })
                return { ...acc, transactions: updatedTxs }
            })

            set({ labeledAccounts: updatedLabeled })
            console.log("Fetched transaction labels and applied mapping:", labelMap)
        } catch (e) {
            console.warn("fetchTransactionLabels: failed to fetch", e);
        }
    },
    async fetchBalances(
        ledger_id = process.env.CANISTER_ID_ICP_LEDGER_CANISTER || ""
    ) {
        let ledgerService = LedgerService.getInstantce(
            ledger_id,
            get().identity || undefined
        )
        if (!ledgerService) throw new Error('LedgerService not initialized')
        const labeled = get().labeledAccounts
        if (!labeled || labeled.length === 0) return
        set({ isLoadingBalances: true, error: null })
        try {
            const decimals = await ledgerService.decimals();
            const currentLabeled = get().labeledAccounts || [];

            // type guard: narrow LabeledAccount -> ICRC1Account when account has Icrc1
            const isIcrc1Labeled = (acc: LabeledAccount): acc is ICRC1Account =>
                !!acc.account && typeof acc.account === 'object' && 'Icrc1' in (acc.account as any)

            const icrc1Accounts = currentLabeled.filter(isStoredIcrc1);

            // fetch balances for icrc1 accounts and build a lookup map so we can preserve
            // non-ICRC accounts in the store (was dropping them previously)
            const balancesArr = await Promise.all(icrc1Accounts.map(async (acc) => {
                // acc.account is { Icrc1: Account }
                const inner = acc.account.Icrc1
                const key = encodeIcrcAccount(toIcrcAccount(inner))
                try {
                    const bal = await ledgerService!.balanceOf(inner);
                    const token = Number(bal) / Math.pow(10, decimals)
                    const usd = getTokenPrice(ledger_id, token)
                    return { key, balance: usd }
                } catch {
                    return { key, balance: 0 }
                }
            }))

            const balanceMap: Record<string, number> = {}
            balancesArr.forEach((b) => { balanceMap[b.key] = b.balance })

            const updatedLabeled = currentLabeled.map((acc) => {
                const key = storedAccountKey(acc)
                if (key in balanceMap) return { ...acc, balance: balanceMap[key] }
                return acc
            })

            set({ labeledAccounts: updatedLabeled })
        } catch (e) {
            set({ error: e instanceof Error ? e.message : String(e) })
        } finally {
            set({ isLoadingBalances: false })
        }
    },

    async fetchIndexTransactions(
        index_id = process.env.CANISTER_ID_ICP_INDEX_CANISTER || "",
        ledger_id = process.env.CANISTER_ID_ICP_LEDGER_CANISTER || ""
    ) {
        const indexService = IndexService.getInstantce(
            index_id,
            get().identity || undefined
        )
        const backendService = BackendService.getInstance(get().identity || undefined)
        const accounts = get().labeledAccounts
        if (!accounts || accounts.length === 0) return
        set({ isLoadingIndex: true, error: null })
        try {
            // fetch any user-set transaction labels so we can apply them to index results
            let labelMap: Record<string, string> = {}
            try {
                const labelsResAny: any = await backendService.getTransactionLabels()
                if (labelsResAny && Array.isArray(labelsResAny)) {
                    labelsResAny.forEach((rec: any) => {
                        try {
                            labelMap[String(rec.id)] = rec.label
                        } catch { }
                    })
                } else if (labelsResAny && typeof labelsResAny === 'object' && 'Ok' in labelsResAny) {
                    for (const rec of labelsResAny.Ok) {
                        try { labelMap[String(rec.id)] = rec.label } catch { }
                    }
                }
            } catch (e) {
                // ignore label fetch errors; we'll proceed without custom labels
                labelMap = {}
            }
            // Build per-account tasks, await them, then assemble txMap from results
            const tasks = accounts.map(async (acc: LabeledAccount) => {
                // Only Icrc1 accounts can be queried from the index/ledger
                if (!isStoredIcrc1(acc)) {
                    const offKey = typeof acc.account === 'object' && 'Offchain' in acc.account ? (acc.account as any).Offchain : ''
                    return { key: offKey, txs: [] }
                }

                const inner = acc.account.Icrc1
                const account_str = encodeIcrcAccount(toIcrcAccount(inner))
                try {
                    const res = await indexService!.getAccountTransactions(inner, 100);
                    const transactions = res.transactions;

                    let temp: Transaction[] = transactions.map((indexTx) => {
                        const res = convertIndexTxToFrontend(
                            indexTx,
                            acc.label,
                            account_str,
                            ledger_id
                        )
                        return res;
                    }).filter((tx) => tx !== null) as Transaction[]

                    // apply any user-set labels fetched earlier (labelMap keyed by string id)
                    temp = temp.map((tx) => {
                        if (!tx) return tx
                        const mapped = labelMap[String(tx.id)]
                        if (mapped && mapped !== tx.label) return { ...tx, label: mapped }
                        return tx
                    })

                    return { key: account_str, txs: temp }
                } catch (err) {
                    console.error(`Failed to fetch transactions for account ${account_str}:`, err)
                    // on error, return empty transaction list for this account
                    return { key: account_str, txs: [] }
                }
            })

            console.log("fetchIndexTransactions - tasks created:", tasks.length);

            const settled = await Promise.allSettled(tasks)
            const txMap: Record<string, Transaction[]> = {}
            for (const r of settled) {
                console.log("fetchIndexTransactions - task result:", r);
                if (r.status === 'fulfilled') {
                    txMap[r.value.key] = r.value.txs
                } else {
                    // rejected: r.reason may have useful info but we already logged per-task
                }
            }

            // map txMap onto current labeled accounts so consumers re-render
            const currentLabeled = get().labeledAccounts || []
            const updatedLabeled = currentLabeled.map((acc) => {
                const key = storedAccountKey(acc)
                const indexTxs = txMap[key] ?? []
                return { ...acc, transactions: indexTxs }
            })
            set({ labeledAccounts: updatedLabeled })
        } catch (e) {
            set({ error: e instanceof Error ? e.message : String(e) })
        } finally {
            set({ isLoadingIndex: false })
        }
    },

    async fetchAll() {
        await get().fetchLabeledAccounts()
        await Promise.allSettled([
            get().fetchBalances(),
            get().fetchIndexTransactions(),
            get().fetchCustomAccount(),
        ])
        // fetch and apply any user-set transaction labels after transactions are loaded
        await get().fetchTransactionLabels()
    },

    async updateTransactionLabel(transactionId: string, label: string) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const maybeId = /^\d+$/.test(transactionId) ? BigInt(transactionId) : (transactionId as any)
            const result = await backend.setTransactionLabel(maybeId, label)
            if (result) {
                return true
            }
            return false
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async createCustomTransaction(tx: { timestamp_ms: number; label: string; amount: number; account: string }) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const amountCents = BigInt(Math.round(tx.amount * 100))
            const timestampNat = BigInt(Math.round(tx.timestamp_ms))
            // build StoredAccount from provided string: try decode as Icrc1, fallback to Offchain
            let storedAccount: any
            try {
                const decoded = decodeIcrcAccount(tx.account)
                const accountForCall: Account = {
                    owner: decoded.owner,
                    subaccount: toNullable(decoded.subaccount),
                }
                storedAccount = { Icrc1: accountForCall } as any
            } catch {
                storedAccount = { Offchain: tx.account } as any
            }

            const result = await backend.createCustomTransaction({
                id: '',
                timestamp_ms: timestampNat,
                label: tx.label,
                amount: amountCents,
                account: storedAccount,
            })
            if (result) {
                await get().fetchCustomAccount()
                return { ok: true, id: result }
            }
            throw new Error('create_custom_transaction failed')
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async updateCustomTransaction(tx: { id: string; timestamp_ms: number; label: string; amount: number; account: string }) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const amountCents = BigInt(Math.round(tx.amount * 100))
            const timestampNat = BigInt(Math.round(tx.timestamp_ms))
            // build StoredAccount for update as well
            let storedAccount: any
            try {
                const decoded = decodeIcrcAccount(tx.account)
                const accountForCall: Account = {
                    owner: decoded.owner,
                    subaccount: toNullable(decoded.subaccount),
                }
                storedAccount = { Icrc1: accountForCall } as any
            } catch {
                storedAccount = { Offchain: tx.account } as any
            }

            const result = await backend.updateCustomTransaction({
                id: tx.id,
                timestamp_ms: timestampNat,
                label: tx.label,
                amount: amountCents,
                account: storedAccount,
            })

            await get().fetchCustomAccount()
            return true
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async deleteCustomTransaction(id: string) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const deleted = await backend.deleteCustomTransaction(id)
            if (deleted) {
                await get().fetchCustomAccount()
                return true
            }
            throw new Error('delete_custom_transaction failed')
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async fetchCustomAccount() {
        const backendService = BackendService.getInstance(get().identity || undefined)
        try {
            const custom = await backendService.getCustomTransactions();
            const raw = Array.isArray(custom) ? custom : []
            const customTxs: Transaction[] = raw.map((c: any) => {
                let accountStr = 'custom'
                if (c.account) {
                    if (typeof c.account === 'object' && 'Offchain' in c.account) {
                        accountStr = c.account.Offchain
                    } else if (typeof c.account === 'object' && 'Icrc1' in c.account) {
                        const inner = c.account.Icrc1
                        try {
                            accountStr = encodeIcrcAccount(toIcrcAccount(inner))
                        } catch {
                            accountStr = 'icrc'
                        }
                    }
                }

                return {
                    id: String(c.id),
                    amount: Number(c.amount) / 100,
                    timestamp_ms: Number(c.timestamp_ms) || Date.now(),
                    account: accountStr,
                    label: c.label || 'custom',
                    isCustom: true,
                }
            }) as Transaction[]
            set({ customTransactions: customTxs })
        } catch (e) {
            console.warn('fetchCustomAccount: failed to fetch custom transactions', e)
            // on error clear custom transactions so UI only shows real data when available
            set({ customTransactions: [] })
        }
    },

    async addAccount(account: string, label: string, product?: string) {
        try {
            const decoded = decodeIcrcAccount(account)
            const accountForCall: Account = {
                owner: decoded.owner,
                subaccount: toNullable(decoded.subaccount),
            }
            const backend = BackendService.getInstance(get().identity || undefined)
            const storedAccount = { Icrc1: accountForCall } as any
            await backend.createLabeledAccount({ label, account: storedAccount, product: product || '' })
            await get().fetchLabeledAccounts()
            await get().fetchBalances()
            return true
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async addOffchainAccount(account: string, label: string, product?: string) {
        try {
            const backend = BackendService.getInstance(get().identity || undefined)
            const storedAccount = { Offchain: account } as any
            await backend.createLabeledAccount({ label, account: storedAccount, product: product || '' })
            await get().fetchLabeledAccounts()
            await get().fetchBalances()
            return true
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async removeAccount(account: string) {
        try {
            const decoded = decodeIcrcAccount(account)
            const accountForCall: Account = {
                owner: decoded.owner,
                subaccount: toNullable(decoded.subaccount),
            }
            const backend = BackendService.getInstance(get().identity || undefined)
            const storedAccount = { Icrc1: accountForCall } as any
            await backend.deleteLabeledAccount(storedAccount)
            await get().fetchLabeledAccounts()
            return true
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async removeOffchainAccount(account: string) {
        try {
            const backend = BackendService.getInstance(get().identity || undefined)
            const storedAccount = { Offchain: account } as any
            await backend.deleteLabeledAccount(storedAccount)
            await get().fetchLabeledAccounts()
            return true
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    clear() {
        set({ labeledAccounts: [], error: null })
    },
}))

export default useAccountStore