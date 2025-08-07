use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, Storable,
};
use icrc_ledger_types::icrc1::account::Account;
use std::borrow::Cow;
use std::cell::RefCell;

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
        // re-consider the Accounts size limit
        max_size: 4096,
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
                if accounts_entry.accounts.is_empty() {
                    accounts.remove(principal);
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
