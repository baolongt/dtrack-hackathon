import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface CreateCustomTransactionRequest {
  'transaction' : CustomTransaction,
}
export interface CreateLabeledAccountRequest {
  'label' : string,
  'account' : StoredAccount,
  'product' : string,
}
export interface CustomTransaction {
  'id' : string,
  'timestamp_ms' : bigint,
  'label' : string,
  'account' : StoredAccount,
  'amount' : bigint,
}
export interface LabeledAccount {
  'label' : string,
  'account' : StoredAccount,
  'product' : string,
}
export interface ProductRequest { 'product' : string }
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : string } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : LabeledAccount } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : Array<CustomTransaction> } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Array<LabeledAccount> } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : Array<string> } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : Array<TransactionLabelRecord> } |
  { 'Err' : string };
export interface SetTransactionLabelRequest {
  'transaction_id' : bigint,
  'label' : string,
}
export type StoredAccount = { 'Offchain' : string } |
  { 'Icrc1' : Account };
export interface TransactionLabelRecord { 'id' : bigint, 'label' : string }
export interface UpdateLabeledAccountRequest {
  'label' : string,
  'account' : StoredAccount,
}
export interface _SERVICE {
  'add_label' : ActorMethod<[string], Result>,
  'add_product' : ActorMethod<[ProductRequest], Result>,
  'create_custom_transaction' : ActorMethod<
    [CreateCustomTransactionRequest],
    Result_1
  >,
  'create_labeled_account' : ActorMethod<
    [CreateLabeledAccountRequest],
    Result_2
  >,
  'delete_custom_transaction' : ActorMethod<[string], Result>,
  'delete_labeled_account' : ActorMethod<[StoredAccount], Result>,
  'get_custom_transactions' : ActorMethod<[], Result_3>,
  'get_labeled_accounts' : ActorMethod<[], Result_4>,
  'get_labels' : ActorMethod<[], Array<string>>,
  'get_products' : ActorMethod<[], Result_5>,
  'get_transaction_labels' : ActorMethod<[], Result_6>,
  'remove_product' : ActorMethod<[string], Result>,
  'set_transaction_label' : ActorMethod<[SetTransactionLabelRequest], Result>,
  'update_custom_transaction' : ActorMethod<[CustomTransaction], Result>,
  'update_labeled_account' : ActorMethod<[UpdateLabeledAccountRequest], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
