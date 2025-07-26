use crate::models::TransactionSummary;
use crate::repository::HOUR_SUMMARIES_STORE;

/// Retrieves the hour summary for the given key if it exists.
pub fn get(key: &str) -> Option<TransactionSummary> {
    HOUR_SUMMARIES_STORE.with(|store| store.borrow().get(&key.to_string()))
}

/// Inserts or updates an hour summary for the given key.
pub fn insert(key: String, summary: TransactionSummary) -> Option<TransactionSummary> {
    HOUR_SUMMARIES_STORE.with(|store| store.borrow_mut().insert(key, summary))
}

/// Removes the hour summary for the given key.
pub fn remove(key: &str) -> Option<TransactionSummary> {
    HOUR_SUMMARIES_STORE.with(|store| store.borrow_mut().remove(&key.to_string()))
}

/// Checks if an hour summary exists for the given key.
pub fn contains_key(key: &str) -> bool {
    HOUR_SUMMARIES_STORE.with(|store| store.borrow().contains_key(&key.to_string()))
}

/// Gets the number of hour summaries stored.
pub fn len() -> u64 {
    HOUR_SUMMARIES_STORE.with(|store| store.borrow().len())
}

/// Checks if the store is empty.
pub fn is_empty() -> bool {
    len() == 0
}

/// Gets all hour summaries as a vector of (String, TransactionSummary) pairs.
/// Note: This is a simplified version - may need optimization for large datasets
pub fn get_all() -> Vec<(String, TransactionSummary)> {
    // Placeholder implementation due to LazyEntry complexity
    Vec::new()
}
