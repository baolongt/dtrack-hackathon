use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::Storable;
use std::collections::HashMap;

// =============================================================================
// Address Manager Service Models
// =============================================================================

#[derive(CandidType, Deserialize, Clone, Debug, Hash, PartialEq, Eq, PartialOrd, Ord)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<serde_bytes::ByteBuf>,
}

impl Storable for Account {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct LabeledAddress {
    pub address: Account,
    pub label: String,
    pub created_at: u64, // timestamp in nanoseconds--
    pub updated_at: u64,
}

impl Storable for LabeledAddress {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

// =============================================================================
// Aggregate Transactions Service Models
// =============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransactionSummary {
    pub account: Account,
    pub total_sent: u64,
    pub total_received: u64,
    pub transaction_count: u32,
    pub period_start: u64, // timestamp
    pub period_end: u64,   // timestamp
}

impl Storable for TransactionSummary {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct AggregateData {
    pub daily_summaries: HashMap<String, TransactionSummary>, // key: "YYYY-MM-DD-account"
    pub monthly_summaries: HashMap<String, TransactionSummary>, // key: "YYYY-MM-account"
}

impl Storable for AggregateData {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

// =============================================================================
// Configuration/Settings Service Models
// =============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserPreferences {
    pub default_currency: String,
    pub timezone: String,
    pub notification_enabled: bool,
    pub polling_interval_seconds: u64,
    pub theme: String, // "light" or "dark"
}

impl Storable for UserPreferences {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub version: String,
    pub maintenance_mode: bool,
    pub max_cached_transactions: u32,
    pub cache_retention_days: u32,
    pub supported_currencies: Vec<String>,
}

impl Storable for AppConfig {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Settings {
    pub user_preferences: HashMap<Principal, UserPreferences>,
    pub app_config: AppConfig,
    pub last_updated: u64,
}

impl Storable for Settings {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            maintenance_mode: false,
            max_cached_transactions: 1000,
            cache_retention_days: 30,
            supported_currencies: vec!["USD".to_string(), "EUR".to_string(), "ICP".to_string()],
        }
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            user_preferences: HashMap::new(),
            app_config: AppConfig::default(),
            last_updated: 0,
        }
    }
}

// =============================================================================
// API Request/Response Models
// =============================================================================

#[derive(CandidType, Deserialize)]
pub struct AddAddressRequest {
    pub address: String,
    pub label: String,
}

#[derive(CandidType, Deserialize)]
pub struct UpdateLabelRequest {
    pub address: String,
    pub new_label: String,
}

#[derive(CandidType, Deserialize)]
pub struct GetTransactionSummaryRequest {
    pub account: String,
    pub period_type: PeriodType,
    pub start_date: Option<u64>,
    pub end_date: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub enum PeriodType {
    Daily,
    Weekly,
    Monthly,
    Custom,
}

#[derive(CandidType, Deserialize)]
pub struct UpdatePreferencesRequest {
    pub preferences: UserPreferences,
}

// =============================================================================
// Error Types
// =============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum DTrackError {
    AddressNotFound { address: String },
    LabelAlreadyExists { label: String },
    UserNotFound { principal: String },
    InvalidAddress { address: String },
    InternalError { message: String },
    Unauthorized,
}

pub type DTrackResult<T> = Result<T, DTrackError>;
