use crate::models::Settings;
use crate::repository::SETTING_STORE;

/// Retrieves the current settings.
pub fn get() -> Settings {
    SETTING_STORE.with(|store| store.borrow().get().clone())
}

/// Updates the settings.
pub fn set(settings: Settings) -> Settings {
    SETTING_STORE.with(|store| {
        let old_settings = store.borrow().get().clone();
        store.borrow_mut().set(settings);
        old_settings
    })
}

/// Gets a copy of the current settings for read-only access.
pub fn get_copy() -> Settings {
    get()
}

/// Updates specific fields in the settings without replacing the entire structure.
pub fn update<F>(updater: F) -> Settings
where
    F: FnOnce(&mut Settings),
{
    SETTING_STORE.with(|store| {
        let mut current_settings = store.borrow().get().clone();
        let old_settings = current_settings.clone();

        updater(&mut current_settings);

        store.borrow_mut().set(current_settings);
        old_settings
    })
}
