import { create } from 'zustand'
import { LabeledAccount, Transaction } from '../hooks/types'
import BackendService from '../services/backend.service'
import LedgerService from '../services/ledger.service'
import IndexService from '../services/index.service'
import { AccountIdentifier, Account } from '@dfinity/ledger-icp'
import { decodeIcrcAccount } from '@dfinity/ledger-icrc'
import { Principal } from '@dfinity/principal'
import { toNullable } from '@dfinity/utils'
import { icpToUsd } from '../lib/utils'
import { Identity } from '@dfinity/agent'

type BalancesMap = Record<string, number> // keyed by account owner (principal text)
type IndexTxMap = Record<string, Transaction[]>

interface AccountStore {
    labeledAccounts: LabeledAccount[]
    balances: BalancesMap
    indexTxs: IndexTxMap
    identity: Identity | null
    isLoadingLabeled: boolean
    isLoadingBalances: boolean
    isLoadingIndex: boolean
    error: string | null
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
    balances: {},
    indexTxs: {},
    identity: null,
    isLoadingLabeled: false,
    isLoadingBalances: false,
    isLoadingIndex: false,
    error: null,

    async fetchLabeledAccounts() {
        let backendService = BackendService.getInstance(get().identity || undefined)
        set({ isLoadingLabeled: true, error: null })
        try {
            const res = await backendService.getLabeledAccounts()
            const labeled = res.map((addr: { account: { owner: { toText: () => string } }; label: string }) => ({
                owner: addr.account.owner.toText(),
                label: addr.label,
                balance: 0,
                transactions: [],
            })) as LabeledAccount[]
            set({ labeledAccounts: labeled })
        } catch (e) {
            set({ error: e instanceof Error ? e.message : String(e) })
        } finally {
            set({ isLoadingLabeled: false })
        }
    },

    async fetchBalances() {
        let ledgerService = LedgerService.getInstantce(
            get().identity || undefined
        )
        if (!ledgerService) throw new Error('LedgerService not initialized')
        const labeled = get().labeledAccounts
        if (!labeled || labeled.length === 0) return
        set({ isLoadingBalances: true, error: null })
        try {
            const decimals = await ledgerService.decimals()
            const newBalances: BalancesMap = {}
            await Promise.all(labeled.map(async (acc: LabeledAccount) => {
                try {
                    const bal = await ledgerService!.balanceOf(acc.owner, [])
                    const icp = Number(bal) / Math.pow(10, decimals)
                    newBalances[acc.owner] = icpToUsd(icp)
                } catch {
                    newBalances[acc.owner] = 0
                }
            }))
            set({ balances: newBalances })
        } catch (e) {
            set({ error: e instanceof Error ? e.message : String(e) })
        } finally {
            set({ isLoadingBalances: false })
        }
    },

    async fetchIndexTransactions() {
        const indexService = IndexService.getInstantce(
            get().identity || undefined
        )
        const labeled = get().labeledAccounts
        if (!labeled || labeled.length === 0) return
        set({ isLoadingIndex: true, error: null })
        try {
            const txMap: IndexTxMap = {}
            await Promise.all(labeled.map(async (acc: LabeledAccount) => {
                try {
                    const res = await indexService!.getAccountTransactions(acc.owner, undefined, BigInt(50))
                    const transactions = res.transactions ?? res
                    const temp: Transaction[] = []
                    if (Array.isArray(transactions)) {
                        for (const trans of transactions) {
                            if ("Transfer" in trans.transaction.operation) {
                                const accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(acc.owner) }).toHex()
                                const to = trans.transaction.operation.Transfer.to
                                const amount_e8s = trans.transaction.operation.Transfer.amount.e8s
                                const isReceived = to === accountId
                                const defaultLabel = isReceived ? 'received' : 'sent'
                                const idStr = String(trans.id)
                                const icpAmount = Number(amount_e8s) / 1e8
                                const signedIcp = isReceived ? icpAmount : -icpAmount
                                const amountUsd = icpToUsd(signedIcp)
                                const timestampNanos = trans.transaction.timestamp?.[0]?.timestamp_nanos ?? BigInt(0)
                                const timestampMs = Math.trunc(Number(timestampNanos) / 1_000_000)
                                temp.push({ id: idStr, amount: amountUsd, timestamp_ms: timestampMs, account: acc.label, label: defaultLabel })
                            }
                        }
                    }
                    txMap[acc.owner] = temp
                } catch {
                    txMap[acc.owner] = []
                }
            }))
            set({ indexTxs: txMap })
        } catch (e) {
            set({ error: e instanceof Error ? e.message : String(e) })
        } finally {
            set({ isLoadingIndex: false })
        }
    },

    async fetchAll() {
        await get().fetchLabeledAccounts()
        await get().fetchBalances()
        await get().fetchIndexTransactions()
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
        set({ labeledAccounts: [], balances: {}, indexTxs: {}, error: null })
    },
}))

export default useAccountStore