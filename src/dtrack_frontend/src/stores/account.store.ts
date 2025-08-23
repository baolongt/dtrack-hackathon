import { create } from 'zustand'
import { LabeledAccount, Transaction } from '../hooks/types'
import BackendService from '../services/backend.service'
import LedgerService from '../services/ledger.service'
import IndexService from '../services/index.service'
import { Account } from '@dfinity/ledger-icp'
import { decodeIcrcAccount, encodeIcrcAccount } from '@dfinity/ledger-icrc'
import { toNullable } from '@dfinity/utils'
import { getTokenPrice, toIcrcAccount } from '../lib/utils'
import { Identity } from '@dfinity/agent'

interface AccountStore {
    labeledAccounts: LabeledAccount[]
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
    fetchAll(): Promise<void>
    updateTransactionLabel(transactionId: string, label: string): Promise<boolean>
    createCustomTransaction(tx: { timestamp_ms: number; label: string; amount: number }): Promise<{ ok: true; id: string } | never>
    updateCustomTransaction(tx: { id: string; timestamp_ms: number; label: string; amount: number }): Promise<boolean>
    deleteCustomTransaction(id: string): Promise<boolean>
    addAccount(account: string, label: string): Promise<boolean>
    removeAccount(account: string): Promise<boolean>
    clear(): void
}

export const useAccountStore = create<AccountStore>((set, get) => ({
    labeledAccounts: [],
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
            const decimals = await ledgerService.decimals()
            const currentLabeled = get().labeledAccounts || []
            const updated = await Promise.all(currentLabeled.map(async (acc: LabeledAccount) => {
                try {
                    const bal = await ledgerService!.balanceOf(acc.account)
                    const token = Number(bal) / Math.pow(10, decimals)
                    const usd = getTokenPrice(ledger_id, token)
                    return { ...acc, balance: usd }
                } catch {
                    return { ...acc, balance: 0 }
                }
            }))
            set({ labeledAccounts: updated })
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
        const accounts = get().labeledAccounts
        if (!accounts || accounts.length === 0) return
        set({ isLoadingIndex: true, error: null })
        try {
            // Build per-account tasks, await them, then assemble txMap from results
            const tasks = accounts.map(async (acc: LabeledAccount) => {
                const account_str = encodeIcrcAccount(toIcrcAccount(acc.account))
                try {
                    const res = await indexService!.getAccountTransactions(acc.account, 100)
                    const transactions = res.transactions ?? res
                    const temp: Transaction[] = []
                    if (Array.isArray(transactions)) {
                        for (const trans of transactions) {
                            console.log("trans", trans);
                            if ("Transfer" in trans.transaction.operation) {
                                const transfer = trans.transaction.operation.Transfer
                                const accountId = account_str
                                const isReceived = transfer.to === accountId
                                const transferAmount = Number(transfer.amount.e8s) / 1e8
                                const tokenAmount = isReceived ? transferAmount : -transferAmount
                                const amountUsd = getTokenPrice(ledger_id, tokenAmount)
                                const timestampNanos = trans.transaction.timestamp?.[0]?.timestamp_nanos ?? BigInt(0)

                                const txObj: Transaction = {
                                    id: String(trans.id),
                                    amount: amountUsd,
                                    timestamp_ms: Math.trunc(Number(timestampNanos) / 1_000_000),
                                    account: acc.label,
                                    label: isReceived ? 'received' : 'sent',
                                }
                                temp.push(txObj)
                            }
                        }
                    }
                    console.log(`fetchIndexTransactions - fetched ${temp.length} transactions for account ${account_str}`);
                    return { key: account_str, txs: temp }
                } catch (err) {
                    console.error(`Failed to fetch transactions for account ${account_str}:`, err)
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

            console.log("fetchIndexTransactions - txMap:", txMap);

            // map txMap onto current labeled accounts so consumers re-render
            const currentLabeled = get().labeledAccounts || []
            const updatedLabeled = currentLabeled.map((acc) => {
                const key = encodeIcrcAccount(toIcrcAccount(acc.account))
                return { ...acc, transactions: txMap[key] ?? [] }
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
            get().fetchIndexTransactions()
        ])
    },

    async updateTransactionLabel(transactionId: string, label: string) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const maybeId = /^\d+$/.test(transactionId) ? BigInt(transactionId) : (transactionId as any)
            const result = await backend.setTransactionLabel(maybeId, label)
            if (result) {
                await get().fetchIndexTransactions()
                return true
            }
            throw new Error('set_transaction_label failed')
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async createCustomTransaction(tx: { timestamp_ms: number; label: string; amount: number }) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const amountCents = BigInt(Math.round(tx.amount * 100))
            const timestampNat = BigInt(Math.round(tx.timestamp_ms))
            const result = await backend.createCustomTransaction({
                id: '',
                timestamp_ms: timestampNat,
                label: tx.label,
                amount: amountCents,
            })
            if (result) {
                await get().fetchIndexTransactions()
                return { ok: true, id: result }
            }
            throw new Error('create_custom_transaction failed')
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async updateCustomTransaction(tx: { id: string; timestamp_ms: number; label: string; amount: number }) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const amountCents = BigInt(Math.round(tx.amount * 100))
            const timestampNat = BigInt(Math.round(tx.timestamp_ms))
            const result = await backend.updateCustomTransaction({
                id: tx.id,
                timestamp_ms: timestampNat,
                label: tx.label,
                amount: amountCents,
            })
            if (result) {
                await get().fetchIndexTransactions()
                return true
            }
            throw new Error('update_custom_transaction failed')
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async deleteCustomTransaction(id: string) {
        const backend = BackendService.getInstance(get().identity || undefined)
        try {
            const deleted = await backend.deleteCustomTransaction(id)
            if (deleted) {
                await get().fetchIndexTransactions()
                return true
            }
            throw new Error('delete_custom_transaction failed')
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e))
        }
    },

    async addAccount(account: string, label: string) {
        try {
            const decoded = decodeIcrcAccount(account)
            const accountForCall: Account = {
                owner: decoded.owner,
                subaccount: toNullable(decoded.subaccount),
            }
            const backend = BackendService.getInstance(get().identity || undefined)
            await backend.createLabeledAccount({ label, account: accountForCall })
            await get().fetchLabeledAccounts()
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
            await backend.deleteLabeledAccount(accountForCall)
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