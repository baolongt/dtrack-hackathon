// Utility to aggregate transactions by day into a shape compatible with the chart
// Input: array of transactions in either mock or store shape.
// Output: Array<{ date: string, total_received: number, transaction_count: number }>

type RawTx = {
    amount?: number;
    timestamp_ms?: number;
    date?: string;
    type?: string; // 'received' or other
};

export function aggregateTransactionsByDay(transactions: RawTx[]) {
    const dayMs = 24 * 60 * 60 * 1000;

    const buckets: Record<string, { total_received: number; transaction_count: number }> = {};

    for (const tx of transactions || []) {
        // determine timestamp
        const ts =
            typeof tx.timestamp_ms === "number"
                ? tx.timestamp_ms
                : tx.date
                    ? Date.parse(tx.date)
                    : Date.now();

        // round to local midnight ISO date (yyyy-mm-dd)
        const d = new Date(Math.floor(ts / dayMs) * dayMs);
        const key = d.toISOString().slice(0, 10);

        const amount = Number(tx.amount || 0);
        const received = tx.type === "received" || amount > 0 ? Math.abs(amount) : 0;

        if (!buckets[key]) buckets[key] = { total_received: 0, transaction_count: 0 };

        buckets[key].total_received += received;
        buckets[key].transaction_count += received > 0 ? 1 : 0;
    }

    // convert to sorted array by date ascending
    return Object.entries(buckets)
        .map(([date, v]) => ({ date, total_received: v.total_received, transaction_count: v.transaction_count }))
        .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

export default aggregateTransactionsByDay;
