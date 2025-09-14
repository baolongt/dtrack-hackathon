export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const ProductRequest = IDL.Record({ 'product' : IDL.Text });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const StoredAccount = IDL.Variant({
    'Offchain' : IDL.Text,
    'Icrc1' : Account,
  });
  const CustomTransaction = IDL.Record({
    'id' : IDL.Text,
    'timestamp_ms' : IDL.Nat64,
    'label' : IDL.Text,
    'account' : StoredAccount,
    'amount' : IDL.Int64,
  });
  const CreateCustomTransactionRequest = IDL.Record({
    'transaction' : CustomTransaction,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const CreateLabeledAccountRequest = IDL.Record({
    'label' : IDL.Text,
    'account' : StoredAccount,
    'product' : IDL.Text,
  });
  const LabeledAccount = IDL.Record({
    'label' : IDL.Text,
    'account' : StoredAccount,
    'product' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'Ok' : LabeledAccount, 'Err' : IDL.Text });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Vec(CustomTransaction),
    'Err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({
    'Ok' : IDL.Vec(LabeledAccount),
    'Err' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Vec(IDL.Text), 'Err' : IDL.Text });
  const TransactionLabelRecord = IDL.Record({
    'id' : IDL.Nat64,
    'label' : IDL.Text,
  });
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Vec(TransactionLabelRecord),
    'Err' : IDL.Text,
  });
  const SetTransactionLabelRequest = IDL.Record({
    'transaction_id' : IDL.Nat64,
    'label' : IDL.Text,
  });
  const UpdateLabeledAccountRequest = IDL.Record({
    'label' : IDL.Text,
    'account' : StoredAccount,
  });
  return IDL.Service({
    'add_label' : IDL.Func([IDL.Text], [Result], []),
    'add_product' : IDL.Func([ProductRequest], [Result], []),
    'create_custom_transaction' : IDL.Func(
        [CreateCustomTransactionRequest],
        [Result_1],
        [],
      ),
    'create_labeled_account' : IDL.Func(
        [CreateLabeledAccountRequest],
        [Result_2],
        [],
      ),
    'delete_custom_transaction' : IDL.Func([IDL.Text], [Result], []),
    'delete_labeled_account' : IDL.Func([StoredAccount], [Result], []),
    'get_custom_transactions' : IDL.Func([], [Result_3], ['query']),
    'get_labeled_accounts' : IDL.Func([], [Result_4], ['query']),
    'get_labels' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'get_products' : IDL.Func([], [Result_5], ['query']),
    'get_transaction_labels' : IDL.Func([], [Result_6], []),
    'remove_product' : IDL.Func([IDL.Text], [Result], []),
    'set_transaction_label' : IDL.Func(
        [SetTransactionLabelRequest],
        [Result],
        [],
      ),
    'update_custom_transaction' : IDL.Func([CustomTransaction], [Result], []),
    'update_labeled_account' : IDL.Func(
        [UpdateLabeledAccountRequest],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
