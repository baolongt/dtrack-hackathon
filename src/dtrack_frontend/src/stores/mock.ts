import { Transaction } from '../hooks/types'

// small deterministic hash -> seed function (xmur3)
function xmur3(str: string) {
    let h = 1779033703 ^ str.length
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
        h = (h << 13) | (h >>> 19)
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507)
        h = Math.imul(h ^ (h >>> 13), 3266489909)
        return (h ^= h >>> 16) >>> 0
    }
}

// mulberry32 PRNG from seed (0..2^32-1)
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6D2B79F5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function makeRngFromString(s: string) {
    const seedFn = xmur3(s)
    const seed = seedFn()
    return mulberry32(seed)
}

function randAmount(rng: () => number, min = 1, max = 300) {
    // return number with 2 decimals between min and max, inclusive-ish
    const cents = Math.floor(rng() * ((max - min) * 100 + 1)) + min * 100
    return Math.round(cents) / 100
}

const LABELS = ['payment', 'salary', 'refund', 'transfer', 'purchase', 'fee', 'reimbursement']

/**
 * Generate deterministic mock index transactions for an account.
 * - account: string used as seed so UI stays stable per-account
 * - ledgerId: optional extra seed component
 * - count: number of transactions to generate (default 10)
 */
export function mockIndexTransactions(account: string, ledgerId = '', count = 10): Transaction[] {
    const rng = makeRngFromString(`${account}::${ledgerId}::index`)
    const now = Date.now()
    const start = new Date('2025-01-01T00:00:00Z').getTime()
    const txs: Transaction[] = []
    for (let i = 0; i < count; i++) {
        const amount = randAmount(rng, 1, 300)
        const label = LABELS[Math.floor(rng() * LABELS.length)]
        // pick uniformly between 2025-01-01 and now
        const timestamp_ms = Math.floor(rng() * (now - start + 1)) + start
        const id = `${Math.abs(Math.floor(rng() * 1e12))}`
        txs.push({
            id,
            amount,
            timestamp_ms,
            account,
            label,
            isCustom: false,
        } as unknown as Transaction)
    }
    // sort descending by time to mimic ledger/index responses
    txs.sort((a, b) => b.timestamp_ms - a.timestamp_ms)

    return txs
}

/**
 * Generate deterministic mock custom transactions.
 * - seed: optional seed so these can be stable per-user/context
 * - count: number of custom transactions (default 5)
 */
export function mockCustomTransactions(seed = 'default-custom', count = 5): Transaction[] {
    const rng = makeRngFromString(`${seed}::custom`)
    const now = Date.now()
    const txs: Transaction[] = []
    for (let i = 0; i < count; i++) {
        const amount = randAmount(rng, 1, 300)
        const label = (rng() > 0.5 ? 'custom' : LABELS[Math.floor(rng() * LABELS.length)])
        const daysBack = Math.floor(rng() * 90)
        const jitter = Math.floor(rng() * 86400000)
        const timestamp_ms = now - daysBack * 24 * 60 * 60 * 1000 - jitter
        const id = `c-${Math.abs(Math.floor(rng() * 1e12))}`
        txs.push({
            id,
            amount,
            timestamp_ms,
            account: 'custom',
            label,
            isCustom: true,
        } as unknown as Transaction)
    }
    txs.sort((a, b) => b.timestamp_ms - a.timestamp_ms)
    return txs
}

export default { mockIndexTransactions, mockCustomTransactions }
