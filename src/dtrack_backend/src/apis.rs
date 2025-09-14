use crate::repository::{get_account,
    add_account, create_custom_transaction as repo_create_custom_transaction,
    delete_custom_transaction as repo_delete_custom_transaction, get_accounts,
    get_custom_transactions as repo_get_custom_transactions,
    get_transaction_labels as repo_get_transaction_labels, remove_account,
    set_transaction_label as repo_set_transaction_label, update_account,
    update_custom_transaction as repo_update_custom_transaction,
};
use crate::types::{CustomTransaction, LabeledAccount, StoredAccount, TransactionLabelRecord};
use candid::{CandidType, Deserialize};
use ic_cdk::api::msg_caller;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CreateLabeledAccountRequest {
    pub account: StoredAccount,
    pub label: String,
    pub product: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UpdateLabeledAccountRequest {
    pub account: StoredAccount,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SetTransactionLabelRequest {
    pub transaction_id: u64,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ProductRequest {
    pub product: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CreateCustomTransactionRequest {
    pub transaction: CustomTransaction,
}

fn validate_label(label: &str) -> bool {
    !label.trim().is_empty() && label.len() <= 100 // Max 100 characters
}

fn validate_product(product: &str) -> bool {
    !product.trim().is_empty() && product.len() <= 100 // Max 100 characters
}

#[ic_cdk::update]
pub fn create_labeled_account(
    request: CreateLabeledAccountRequest,
) -> Result<LabeledAccount, String> {
    if !validate_label(&request.label) {
        return Err("Invalid label".to_string());
    }

    if !validate_product(&request.product) {
        return Err("Invalid product".to_string());
    }

    add_account(
        &msg_caller(),
        LabeledAccount {
            account: request.account.clone(),
            label: request.label.trim().to_string(),
            product: request.product.clone(),
        },
    )?;

    Ok(LabeledAccount {
        account: request.account,
        label: request.label,
        product: request.product,
    })
}

#[ic_cdk::query]
pub fn get_labeled_accounts() -> Result<Vec<LabeledAccount>, String> {
    Ok(get_accounts(&msg_caller()))
}

#[ic_cdk::update]
pub fn delete_labeled_account(address: StoredAccount) -> Result<(), String> {
    remove_account(&msg_caller(), &address)
}

#[ic_cdk::update]
pub fn update_labeled_account(request: UpdateLabeledAccountRequest) -> Result<(), String> {
    if !validate_label(&request.label) {
        return Err("Invalid label".to_string());
    }

    let mut saved_account = match get_account(&msg_caller(), &request.account.clone()){
        Some(acc) => acc, 
        None => return Err("Account not found".to_string())
    };
    saved_account.label = request.label.trim().to_string();
    
    update_account(&msg_caller(), saved_account)?;

    Ok(())
}

#[ic_cdk::update]
pub fn get_transaction_labels() -> Result<Vec<TransactionLabelRecord>, String> {
    Ok(repo_get_transaction_labels(&msg_caller()))
}

#[ic_cdk::update]
pub fn add_product(request: ProductRequest) -> Result<(), String> {
    if request.product.trim().is_empty() || request.product.len() > 100 {
        return Err("Invalid product".to_string());
    }

    crate::repository::add_product(&msg_caller(), request.product.trim().to_string())
}

#[ic_cdk::update]
pub fn remove_product(product: String) -> Result<(), String> {
    crate::repository::remove_product(&msg_caller(), &product)
}

#[ic_cdk::query]
pub fn get_products() -> Result<Vec<String>, String> {
    Ok(crate::repository::get_products(&msg_caller()))
}

#[ic_cdk::update]
pub fn set_transaction_label(request: SetTransactionLabelRequest) -> Result<(), String> {
    if !validate_label(&request.label) {
        return Err("Invalid label".to_string());
    }

    repo_set_transaction_label(
        &msg_caller(),
        request.transaction_id,
        request.label.trim().to_string(),
    )
}

/* Custom transaction endpoints (matching updated .did) */

#[ic_cdk::update]
pub fn create_custom_transaction(
    request: CreateCustomTransactionRequest,
) -> Result<String, String> {
    if !validate_label(&request.transaction.label) {
        return Err("Invalid label".to_string());
    }

    // amount validation (optional): ensure non-zero
    // if request.transaction.amount == 0 {
    //     return Err("Amount must be greater than zero".to_string());
    // }

    repo_create_custom_transaction(&msg_caller(), request.transaction.clone())
}

#[ic_cdk::query]
pub fn get_custom_transactions() -> Result<Vec<CustomTransaction>, String> {
    Ok(repo_get_custom_transactions(&msg_caller()))
}

#[ic_cdk::update]
pub fn update_custom_transaction(transaction: CustomTransaction) -> Result<(), String> {
    if !validate_label(&transaction.label) {
        return Err("Invalid label".to_string());
    }
    repo_update_custom_transaction(&msg_caller(), transaction)
}

#[ic_cdk::update]
pub fn delete_custom_transaction(id: String) -> Result<(), String> {
    repo_delete_custom_transaction(&msg_caller(), &id)
}

#[ic_cdk::update]
pub fn add_label(label: String) -> Result<(), String> {
    if !validate_label(&label) {
        return Err("Invalid label".to_string());
    }

    crate::repository::add_label(&msg_caller(), label.trim().to_string())
}

#[ic_cdk::update]
pub fn get_labels() -> Vec<String> {
    let caller = msg_caller();
    crate::repository::get_labels(&caller)
}
