use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, Storable,
};
use icrc_ledger_types::icrc1::account::Account;
use std::borrow::Cow;
use std::cell::RefCell;
use ic_cdk::api::time;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Deserialize)]
struct Accounts {
    pub accounts: Vec<LabeledAccount>,
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct LabeledAccount {
    pub account: Account,
    pub label: String,
}

impl Storable for Accounts {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 4096,
        is_fixed_size: false,
    };
}

// New type for storing a single transaction label
#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct TransactionLabelRecord {
    pub id: u64,
    pub label: String,
}

#[derive(CandidType, Deserialize)]
pub struct TxLabels {
    pub labels: Vec<TransactionLabelRecord>,
}

impl Storable for TxLabels {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }
    const BOUND: Bound = Bound::Bounded {
        max_size: 4096,
        is_fixed_size: false,
    };
}

// CustomTransaction types (added to match updated .did)
#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct CustomTransaction {
    pub id: String,
    pub date: String,
    pub label: String,
    pub amount: u64,
}

#[derive(CandidType, Deserialize)]
pub struct CustomTransactions {
    pub transactions: Vec<CustomTransaction>,
}

impl Storable for CustomTransactions {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        // allow larger storage for custom transactions; adjust as needed
        max_size: 8192,
        is_fixed_size: false,
    };
}

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
}

pub fn get_accounts(principal: &Principal) -> Vec<LabeledAccount> {
    ACCOUNTS.with_borrow(|accounts| {
        accounts
            .get(principal)
            .map_or_else(|| vec![], |accounts| accounts.accounts)
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

pub fn remove_account(principal: &Principal, account: &Account) -> Result<(), String> {
    ACCOUNTS.with_borrow_mut(|accounts| {
        if let Some(mut accounts_entry) = accounts.get(principal) {
            if let Some(pos) = accounts_entry.accounts.iter().position(|x| x.account == *account) {
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

pub fn update_account(
    principal: &Principal,
    account: LabeledAccount,
) -> Result<(), String> {
    ACCOUNTS.with_borrow_mut(|accounts| {
        if let Some(mut accounts_entry) = accounts.get(principal) {
            if let Some(pos) = accounts_entry.accounts.iter().position(|x| x.account == account.account) {
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

pub fn set_transaction_label(principal: &Principal, transaction_id: u64, label: String) -> Result<(), String> {
    TRANSACTION_LABELS.with_borrow_mut(|tx_labels| {
        let mut entry = tx_labels.get(principal).unwrap_or_else(|| TxLabels { labels: vec![] });
        if let Some(pos) = entry.labels.iter().position(|x| x.id == transaction_id) {
            entry.labels[pos].label = label;
        } else {
            entry.labels.push(TransactionLabelRecord { id: transaction_id, label });
        }
        tx_labels.insert(principal.clone(), entry);
        Ok(())
    })
}

pub fn get_transaction_labels(principal: &Principal) -> Vec<TransactionLabelRecord> {
    TRANSACTION_LABELS.with_borrow(|tx_labels| {
        tx_labels.get(principal).map_or_else(|| vec![], |entry| entry.labels)
    })
}

// Custom transactions repository functions (new to match .did)

pub fn get_custom_transactions(principal: &Principal) -> Vec<CustomTransaction> {
    CUSTOM_TRANSACTIONS.with_borrow(|ct| {
        ct.get(principal)
            .map_or_else(|| vec![], |entry| entry.transactions)
    })
}

pub fn create_custom_transaction(principal: &Principal, mut transaction: CustomTransaction) -> Result<String, String> {
    CUSTOM_TRANSACTIONS.with_borrow_mut(|ct| {
        let mut entry = ct.get(principal).unwrap_or_else(|| CustomTransactions { transactions: vec![] });

        // Use provided id if not empty, otherwise generate an id from the current time
        let id = if transaction.id.trim().is_empty() {
            time().to_string()
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

pub fn update_custom_transaction(principal: &Principal, transaction: CustomTransaction) -> Result<(), String> {
    CUSTOM_TRANSACTIONS.with_borrow_mut(|ct| {
        if let Some(mut entry) = ct.get(principal) {
            if let Some(pos) = entry.transactions.iter().position(|t| t.id == transaction.id) {
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