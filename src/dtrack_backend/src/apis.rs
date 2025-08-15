use crate::repository::{
    add_account, get_accounts, get_transaction_labels as repo_get_transaction_labels,
    remove_account, set_transaction_label as repo_set_transaction_label, update_account,
    LabeledAccount, TransactionLabelRecord,
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
    pub account: Account, // provided for verification, if needed
    pub transaction_id: u64,
    pub label: String,
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
pub fn get_transaction_labels(account: Account) -> Result<Vec<TransactionLabelRecord>, String> {
    if account.owner != msg_caller() {
        return Err("Unauthorized: account owner mismatch".to_string());
    }
    Ok(repo_get_transaction_labels(&msg_caller()))
}

#[ic_cdk::update]
pub fn set_transaction_label(request: SetTransactionLabelRequest) -> Result<(), String> {
    if !validate_label(&request.label) {
        return Err("Invalid label".to_string());
    }
    if request.account.owner != msg_caller() {
        return Err("Unauthorized: account owner mismatch".to_string());
    }
    repo_set_transaction_label(
        &msg_caller(),
        request.transaction_id,
        request.label.trim().to_string(),
    )
}
