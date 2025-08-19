use crate::repository::{
    add_account, create_custom_transaction as repo_create_custom_transaction,
    delete_custom_transaction as repo_delete_custom_transaction, get_accounts,
    get_custom_transactions as repo_get_custom_transactions,
    get_transaction_labels as repo_get_transaction_labels, remove_account,
    set_transaction_label as repo_set_transaction_label, update_account, update_custom_transaction as repo_update_custom_transaction,
    CustomTransaction, LabeledAccount, TransactionLabelRecord,
};
use candid::{CandidType, Deserialize};
use ic_cdk::api::msg_caller;
use icrc_ledger_types::icrc1::account::Account;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CreateLabeledAccountRequest {
    pub account: Account,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UpdateLabeledAccountRequest {
    pub account: Account,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SetTransactionLabelRequest {
    pub transaction_id: u64,
    pub label: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CreateCustomTransactionRequest {
    pub transaction: CustomTransaction,
}

fn validate_label(label: &str) -> bool {
    !label.trim().is_empty() && label.len() <= 100 // Max 100 characters
}

#[ic_cdk::update]
pub fn create_labeled_account(
    request: CreateLabeledAccountRequest,
) -> Result<LabeledAccount, String> {
    if !validate_label(&request.label) {
        return Err("Invalid label".to_string());
    }

    add_account(
        &msg_caller(),
        LabeledAccount {
            account: request.account.clone(),
            label: request.label.trim().to_string(),
        },
    )?;

    Ok(LabeledAccount {
        account: request.account,
        label: request.label,
    })
}

#[ic_cdk::query]
pub fn get_labeled_accounts() -> Result<Vec<LabeledAccount>, String> {
    Ok(get_accounts(&msg_caller()))
}

#[ic_cdk::update]
pub fn delete_labeled_account(address: Account) -> Result<(), String> {
    remove_account(&msg_caller(), &address)
}

#[ic_cdk::update]
pub fn update_labeled_account(request: UpdateLabeledAccountRequest) -> Result<(), String> {
    if !validate_label(&request.label) {
        return Err("Invalid label".to_string());
    }

    let labeled_account = LabeledAccount {
        account: request.account.clone(),
        label: request.label.trim().to_string(),
    };

    update_account(&msg_caller(), labeled_account)?;

    Ok(())
}

#[ic_cdk::update]
pub fn get_transaction_labels() -> Result<Vec<TransactionLabelRecord>, String> {
    Ok(repo_get_transaction_labels(&msg_caller()))
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