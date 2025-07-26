use crate::models::{Account, LabeledAddress, Settings, TransactionSummary};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, StableCell,
};
use std::cell::RefCell;

// Module declarations
pub mod daily_summaries_store;
pub mod hour_summaries_store;
pub mod labeled_address_store;
pub mod monthly_summaries_store;
pub mod settings_store;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

// Memory IDs
const LABELED_ADDRESS_STORE_ID: MemoryId = MemoryId::new(0);
const HOUR_SUMMARIES_STORE_ID: MemoryId = MemoryId::new(1);
const DAILY_SUMMARIES_STORE_ID: MemoryId = MemoryId::new(2);
const MONTHLY_SUMMARIES_STORE_ID: MemoryId = MemoryId::new(3);
const SETTING_STORE_ID: MemoryId = MemoryId::new(4);

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // LabeledAddressStore - BTreeMap Account -> LabeledAddress
    pub static LABELED_ADDRESS_STORE: RefCell<StableBTreeMap<Account, LabeledAddress, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(LABELED_ADDRESS_STORE_ID))
        )
    );

    // HourSummariesStore - BTreeMap String -> TransactionSummary
    pub static HOUR_SUMMARIES_STORE: RefCell<StableBTreeMap<String, TransactionSummary, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(HOUR_SUMMARIES_STORE_ID))
        )
    );

    // DailySummariesStore - BTreeMap String -> TransactionSummary
    pub static DAILY_SUMMARIES_STORE: RefCell<StableBTreeMap<String, TransactionSummary, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(DAILY_SUMMARIES_STORE_ID))
        )
    );

    // MonthlySummariesStore - BTreeMap String -> TransactionSummary
    pub static MONTHLY_SUMMARIES_STORE: RefCell<StableBTreeMap<String, TransactionSummary, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MONTHLY_SUMMARIES_STORE_ID))
        )
    );

    // SettingStore - Cell Settings
    pub static SETTING_STORE: RefCell<StableCell<Settings, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(SETTING_STORE_ID)),
            Settings::default()
        )
    );
}

pub fn load() {
    LABELED_ADDRESS_STORE.with(|t| {
        *t.borrow_mut() =
            StableBTreeMap::init(MEMORY_MANAGER.with_borrow(|m| m.get(LABELED_ADDRESS_STORE_ID)));
    });

    HOUR_SUMMARIES_STORE.with(|t| {
        *t.borrow_mut() =
            StableBTreeMap::init(MEMORY_MANAGER.with_borrow(|m| m.get(HOUR_SUMMARIES_STORE_ID)));
    });

    DAILY_SUMMARIES_STORE.with(|t| {
        *t.borrow_mut() =
            StableBTreeMap::init(MEMORY_MANAGER.with_borrow(|m| m.get(DAILY_SUMMARIES_STORE_ID)));
    });

    MONTHLY_SUMMARIES_STORE.with(|t| {
        *t.borrow_mut() =
            StableBTreeMap::init(MEMORY_MANAGER.with_borrow(|m| m.get(MONTHLY_SUMMARIES_STORE_ID)));
    });

    SETTING_STORE.with(|t| {
        *t.borrow_mut() = StableCell::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(SETTING_STORE_ID)),
            Settings::default(),
        );
    });
}
