export const mockData = {
    "TransactionSummary": Array.from({ length: 30 }, (_, i) => ({
        total_received: Math.floor(Math.random() * 1000000),
        transaction_count: Math.floor(Math.random() * 100),
        date: new Date(2024, 3, 1 + i).toISOString().split('T')[0] // Incrementing dates starting from 2024-04-01
    })),
    "TransactionSummaryMonthly": Array.from({ length: 12 }, (_, i) => ({
        total_received: Math.floor(Math.random() * 100000000),
        transaction_count: Math.floor(Math.random() * 100),
        date: new Date(2024, i, 1).toISOString().split('T')[0] // Monthly data for 2024
    })),
};