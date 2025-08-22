import { create } from 'zustand'
import { LabeledAccount, Transaction } from '../hooks/types'
import BackendService from '../services/backend.service'
import LedgerService from '../services/ledger.service'
import IndexService from '../services/index.service'
import { AccountIdentifier } from '@dfinity/ledger-icp'
import { Principal } from '@dfinity/principal'
import { icpToUsd } from '../lib/utils'
import { canisterId, createActor } from '../../../declarations/dtrack_backend'

type BalancesMap = Record<string, number> // keyed by account owner (principal text)
type IndexTxMap = Record<string, Transaction[]>

interface AccountStore {
    labeledAccounts: LabeledAccount[]
    balances: BalancesMap
    indexTxs: IndexTxMap
    isLoadingLabeled: boolean
    isLoadingBalances: boolean
    isLoadingIndex: boolean
    error: string | null

    // fetchers (async)
    fetchLabeledAccounts(): Promise<void>
    fetchBalances(): Promise<void>
    fetchIndexTransactions(): Promise<void>
    fetchAll(): Promise<void>

    clear(): void
}

const actor = createActor(canisterId, {
    agentOptions: {
        fetch,
        host: host,
        shouldFetchRootKey: true,
    },
});

let _backendService = BackendService.getInstance(actor) // singleton instance
let _ledgerService = LedgerService.getInstance()
let _indexService = IndexService.getInstance()

export const useAccountStore = create<AccountStore>((set, get) => ({
    labeledAccounts: [],
    balances: {},
    indexTxs: {},
    isLoadingLabeled: false,
    isLoadingBalances: false,
    isLoadingIndex: false,
    error: null,

    async fetchLabeledAccounts() {
        if (!_backendService) throw new Error('BackendService not initialized')
        set({ isLoadingLabeled: true, error: null })
        try {
            const res = await _backendService.getLabeledAccounts()
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
        if (!_ledgerService) throw new Error('LedgerService not initialized')
        const labeled = get().labeledAccounts
        if (!labeled || labeled.length === 0) return
        set({ isLoadingBalances: true, error: null })
        try {
            const decimals = await _ledgerService.decimals()
            const newBalances: BalancesMap = {}
            await Promise.all(labeled.map(async (acc: LabeledAccount) => {
                try {
                    const bal = await _ledgerService!.balanceOf(acc.owner, [])
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
        if (!_indexService) throw new Error('IndexService not initialized')
        const labeled = get().labeledAccounts
        if (!labeled || labeled.length === 0) return
        set({ isLoadingIndex: true, error: null })
        try {
            const txMap: IndexTxMap = {}
            await Promise.all(labeled.map(async (acc: LabeledAccount) => {
                try {
                    const res = await _indexService!.getAccountTransactions(acc.owner, undefined, BigInt(50))
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

    clear() {
        set({ labeledAccounts: [], balances: {}, indexTxs: {}, error: null })
    },
}))

export default useAccountStore