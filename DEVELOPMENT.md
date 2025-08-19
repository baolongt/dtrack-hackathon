```sh
$ dfx start --clean --background

# install ICP ledger
$ dfx nns install

$ dfx deploy dtrack_backend

# deploy index canister for ICP ledger
$ dfx deploy icp_index_canister --argument '(record { ledger_id = principal "ryjl3-tyaaa-aaaaa-aaaba-cai" })'

# make sure you configure needed environment variables in `.env`
$ npm run start
```