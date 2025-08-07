use candid::{CandidType, Deserialize};
use icrc_ledger_types::icrc1::account::Account;
use crate::repository::{LabeledAccount, add_account, get_accounts, remove_account, update_account};
use ic_cdk::api::msg_caller;

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

    add_account(&msg_caller(), LabeledAccount {
        account: request.account.clone(),
        label: request.label.trim().to_string(),
    })?;

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
pub fn update_labeled_account(
    request: UpdateLabeledAccountRequest,
) -> Result<(), String> {
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
