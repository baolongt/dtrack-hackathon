use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use icrc_ledger_types::icrc1::account::Account;
use std::borrow::Cow;

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum StoredAccount {
    Icrc1(Account),
    Offchain(String),
}

// Accounts wrapper used for stable storage
#[derive(CandidType, Deserialize)]
pub struct Accounts {
    pub accounts: Vec<LabeledAccount>,
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct LabeledAccount {
    pub account: StoredAccount,
    pub label: String,
}

impl Storable for Accounts {
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
    pub timestamp_ms: u64,
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
