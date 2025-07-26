use crate::models::{Account, LabeledAddress};
use crate::repository::LABELED_ADDRESS_STORE;

/// Retrieves the labeled address associated with the given account if it exists.
pub fn get(account: &Account) -> Option<LabeledAddress> {
    LABELED_ADDRESS_STORE.with(|store| store.borrow().get(account))
}

/// Inserts or updates a labeled address for the given account.
pub fn insert(account: Account, labeled_address: LabeledAddress) -> Option<LabeledAddress> {
    LABELED_ADDRESS_STORE.with(|store| store.borrow_mut().insert(account, labeled_address))
}

/// Removes the labeled address for the given account.
pub fn remove(account: &Account) -> Option<LabeledAddress> {
    LABELED_ADDRESS_STORE.with(|store| store.borrow_mut().remove(account))
}

/// Gets all labeled addresses as a vector of (Account, LabeledAddress) pairs.
/// Note: This is a simplified version - may need optimization for large datasets
pub fn get_all() -> Vec<(Account, LabeledAddress)> {
    LABELED_ADDRESS_STORE.with(|store| {
        let mut result = Vec::new();
        let store_ref = store.borrow();

        for entry in store_ref.iter() {
            let key = entry.key().clone();
            let value = entry.value().clone();
            result.push((key, value));
        }

        result
    })
}

/// Checks if a labeled address exists for the given account.
pub fn contains_key(account: &Account) -> bool {
    LABELED_ADDRESS_STORE.with(|store| store.borrow().contains_key(account))
}

/// Gets the number of labeled addresses stored.
pub fn len() -> u64 {
    LABELED_ADDRESS_STORE.with(|store| store.borrow().len())
}

/// Checks if the store is empty.
pub fn is_empty() -> bool {
    len() == 0
}
