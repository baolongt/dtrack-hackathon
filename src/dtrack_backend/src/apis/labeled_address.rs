use crate::models::{Account, LabeledAddress};
use crate::repository::labeled_address_store;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;

// =============================================================================
// Request/Response Types
// =============================================================================

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CreateLabeledAddressRequest {
    pub address: Account,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UpdateLabeledAddressRequest {
    pub address: Account,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct LabeledAddressResponse {
    pub address: Account,
    pub label: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum LabeledAddressError {
    AddressNotFound,
    AddressAlreadyExists,
    InvalidLabel,
    Unauthorized,
}

pub type LabeledAddressResult<T> = Result<T, LabeledAddressError>;

// =============================================================================
// Helper Functions
// =============================================================================

fn validate_label(label: &str) -> bool {
    !label.trim().is_empty() && label.len() <= 100 // Max 100 characters
}

fn labeled_address_to_response(labeled_address: &LabeledAddress) -> LabeledAddressResponse {
    LabeledAddressResponse {
        address: labeled_address.address.clone(),
        label: labeled_address.label.clone(),
        created_at: labeled_address.created_at,
        updated_at: labeled_address.updated_at,
    }
}

// =============================================================================
// API Functions
// =============================================================================

/// Creates a new labeled address
#[ic_cdk::update]
pub fn create_labeled_address(
    request: CreateLabeledAddressRequest,
) -> LabeledAddressResult<LabeledAddressResponse> {
    // Validate the label
    if !validate_label(&request.label) {
        return Err(LabeledAddressError::InvalidLabel);
    }

    // Check if address already exists
    if labeled_address_store::contains_key(&request.address) {
        return Err(LabeledAddressError::AddressAlreadyExists);
    }

    let now = time();
    let labeled_address = LabeledAddress {
        address: request.address.clone(),
        label: request.label.trim().to_string(),
        created_at: now,
        updated_at: now,
    };

    labeled_address_store::insert(request.address, labeled_address.clone());

    Ok(labeled_address_to_response(&labeled_address))
}

/// Gets a labeled address by account
#[ic_cdk::query]
pub fn get_labeled_address(address: Account) -> LabeledAddressResult<LabeledAddressResponse> {
    let labeled_address =
        labeled_address_store::get(&address).ok_or(LabeledAddressError::AddressNotFound)?;

    Ok(labeled_address_to_response(&labeled_address))
}

/// Deletes a labeled address
#[ic_cdk::update]
pub fn delete_labeled_address(address: Account) -> LabeledAddressResult<LabeledAddressResponse> {
    let labeled_address =
        labeled_address_store::remove(&address).ok_or(LabeledAddressError::AddressNotFound)?;

    Ok(labeled_address_to_response(&labeled_address))
}

/// Gets all labeled addresses
#[ic_cdk::query]
pub fn get_all_labeled_addresses() -> Vec<LabeledAddressResponse> {
    // Note: This implementation may need optimization for large datasets
    // For now, we'll return a simple implementation that can be improved later
    labeled_address_store::get_all()
        .into_iter()
        .map(|(_, labeled_address)| labeled_address_to_response(&labeled_address))
        .collect()
}
