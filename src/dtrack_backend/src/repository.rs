use candid::Principal;
use ic_cdk::api::time;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};
// Account types are represented via StoredAccount in `types.rs`.
use std::cell::RefCell;

use crate::types::{
    Accounts, CustomTransaction, CustomTransactions, LabelList, LabeledAccount, ProductList, StoredAccount,
    TransactionLabelRecord, TxLabels,
};

pub type Memory = VirtualMemory<DefaultMemoryImpl>;
thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static ACCOUNTS: RefCell<StableBTreeMap<Principal, Accounts, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MemoryId::new(0)))
        )
    );

    pub static TRANSACTION_LABELS: RefCell<StableBTreeMap<Principal, TxLabels, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MemoryId::new(1)))
        )
    );

    pub static CUSTOM_TRANSACTIONS: RefCell<StableBTreeMap<Principal, CustomTransactions, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MemoryId::new(2)))
        )
    );

    pub static USER_LABEL: RefCell<StableBTreeMap<Principal, LabelList, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MemoryId::new(3)))
        )
    );

    pub static USER_PRODUCT: RefCell<StableBTreeMap<Principal, ProductList, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MemoryId::new(4)))
        )
    );
}

pub fn get_accounts(principal: &Principal) -> Vec<LabeledAccount> {
    ACCOUNTS.with_borrow(|accounts| {
        accounts
            .get(principal)
            .map_or_else(|| vec![], |accounts| accounts.accounts)
    })
}

pub fn get_account(principal: &Principal, account: &StoredAccount) -> Option<LabeledAccount> {
    ACCOUNTS.with_borrow(|accounts| {
        accounts
            .get(principal)
            .and_then(|accounts_entry| {
                accounts_entry.accounts.iter().find(|la| la.account == *account).cloned()
            })
    })
}

pub fn add_account(principal: &Principal, account: LabeledAccount) -> Result<(), String> {
    ACCOUNTS.with_borrow_mut(|accounts| {
        let mut accounts_entry = accounts
            .get(principal)
            .unwrap_or_else(|| Accounts { accounts: vec![] });
        if accounts_entry.accounts.len() >= 20 {
            return Err("Maximum number of accounts reached".to_string());
        }
        if !accounts_entry.accounts.contains(&account) {
            accounts_entry.accounts.push(account);
            accounts.insert(principal.clone(), accounts_entry);
            Ok(())
        } else {
            return Err("Account already exists".to_string());
        }
    })
}

pub fn remove_account(principal: &Principal, account: &StoredAccount) -> Result<(), String> {
    ACCOUNTS.with_borrow_mut(|accounts| {
        if let Some(mut accounts_entry) = accounts.get(principal) {
            if let Some(pos) = accounts_entry
                .accounts
                .iter()
                .position(|x| x.account == *account)
            {
                accounts_entry.accounts.remove(pos);

                TRANSACTION_LABELS.with_borrow_mut(|tx_labels| {
                    tx_labels.remove(principal);
                });

                // also remove custom transactions for this principal if no accounts left
                if accounts_entry.accounts.is_empty() {
                    accounts.remove(principal);
                    CUSTOM_TRANSACTIONS.with_borrow_mut(|ct| {
                        ct.remove(principal);
                    });
                } else {
                    accounts.insert(principal.clone(), accounts_entry);
                }
                Ok(())
            } else {
                Err("Account not found".to_string())
            }
        } else {
            Err("No accounts found for this principal".to_string())
        }
    })
}

pub fn update_account(principal: &Principal, account: LabeledAccount) -> Result<(), String> {
    ACCOUNTS.with_borrow_mut(|accounts| {
        if let Some(mut accounts_entry) = accounts.get(principal) {
            if let Some(pos) = accounts_entry
                .accounts
                .iter()
                .position(|x| x.account == account.account)
            {
                accounts_entry.accounts[pos] = account;
                accounts.insert(principal.clone(), accounts_entry);
                Ok(())
            } else {
                Err("Account not found".to_string())
            }
        } else {
            Err("No accounts found for this principal".to_string())
        }
    })
}

pub fn set_transaction_label(
    principal: &Principal,
    transaction_id: u64,
    label: String,
) -> Result<(), String> {
    TRANSACTION_LABELS.with_borrow_mut(|tx_labels| {
        let mut entry = tx_labels
            .get(principal)
            .unwrap_or_else(|| TxLabels { labels: vec![] });
        if let Some(pos) = entry.labels.iter().position(|x| x.id == transaction_id) {
            entry.labels[pos].label = label;
        } else {
            entry.labels.push(TransactionLabelRecord {
                id: transaction_id,
                label,
            });
        }
        tx_labels.insert(principal.clone(), entry);
        Ok(())
    })
}

pub fn get_transaction_labels(principal: &Principal) -> Vec<TransactionLabelRecord> {
    TRANSACTION_LABELS.with_borrow(|tx_labels| {
        tx_labels
            .get(principal)
            .map_or_else(|| vec![], |entry| entry.labels)
    })
}

// Custom transactions repository functions (new to match .did)

pub fn get_custom_transactions(principal: &Principal) -> Vec<CustomTransaction> {
    CUSTOM_TRANSACTIONS.with_borrow(|ct| {
        ct.get(principal)
            .map_or_else(|| vec![], |entry| entry.transactions)
    })
}

pub fn create_custom_transaction(
    principal: &Principal,
    mut transaction: CustomTransaction,
) -> Result<String, String> {
    CUSTOM_TRANSACTIONS.with_borrow_mut(|ct| {
        let mut entry = ct.get(principal).unwrap_or_else(|| CustomTransactions {
            transactions: vec![],
        });

        // Use provided id if not empty, otherwise generate an id from the current time
        let id = if transaction.id.trim().is_empty() {
            format!("C#{}", time() / 1_000_000_000)
        } else {
            transaction.id.trim().to_string()
        };

        // ensure uniqueness
        if entry.transactions.iter().any(|t| t.id == id) {
            return Err("Transaction id already exists".to_string());
        }

        transaction.id = id.clone();
        entry.transactions.push(transaction);
        ct.insert(principal.clone(), entry);
        Ok(id)
    })
}

pub fn update_custom_transaction(
    principal: &Principal,
    transaction: CustomTransaction,
) -> Result<(), String> {
    CUSTOM_TRANSACTIONS.with_borrow_mut(|ct| {
        if let Some(mut entry) = ct.get(principal) {
            if let Some(pos) = entry
                .transactions
                .iter()
                .position(|t| t.id == transaction.id)
            {
                entry.transactions[pos] = transaction;
                ct.insert(principal.clone(), entry);
                Ok(())
            } else {
                Err("Custom transaction not found".to_string())
            }
        } else {
            Err("No custom transactions for this principal".to_string())
        }
    })
}

pub fn delete_custom_transaction(principal: &Principal, id: &str) -> Result<(), String> {
    CUSTOM_TRANSACTIONS.with_borrow_mut(|ct| {
        if let Some(mut entry) = ct.get(principal) {
            if let Some(pos) = entry.transactions.iter().position(|t| t.id == id) {
                entry.transactions.remove(pos);
                if entry.transactions.is_empty() {
                    ct.remove(principal);
                } else {
                    ct.insert(principal.clone(), entry);
                }
                Ok(())
            } else {
                Err("Custom transaction not found".to_string())
            }
        } else {
            Err("No custom transactions for this principal".to_string())
        }
    })
}

pub fn add_label(principal: &Principal, label: String) -> Result<(), String> {
    USER_LABEL.with_borrow_mut(|ul| {
        let mut entry = ul.get(principal).unwrap_or_else(|| LabelList(vec![]));
        if entry.0.len() >= 50 {
            return Err("Maximum number of labels reached".to_string());
        }
        if !entry.0.contains(&label) {
            entry.0.push(label);
            ul.insert(principal.clone(), entry);
            Ok(())
        } else {
            return Err("Label already exists".to_string());
        }
    })
}

pub fn get_labels(principal: &Principal) -> Vec<String> {
    USER_LABEL.with_borrow(|ul| ul.get(principal).map_or_else(|| vec![], |entry| entry.0))
}

pub fn add_product(principal: &Principal, product: String) -> Result<(), String> {
    USER_PRODUCT.with_borrow_mut(|up| {
        let mut entry = up.get(principal).unwrap_or_else(|| ProductList(vec![]));
        if entry.0.len() >= 50 {
            return Err("Maximum number of products reached".to_string());
        }
        if !entry.0.contains(&product) {
            entry.0.push(product);
            up.insert(principal.clone(), entry);
            Ok(())
        } else {
            return Err("Product already exists".to_string());
        }
    })
}

pub fn get_products(principal: &Principal) -> Vec<String> {
    USER_PRODUCT.with_borrow(|up| up.get(principal).map_or_else(|| vec![], |entry| entry.0))
}
