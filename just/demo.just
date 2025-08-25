[group('demo')]
demo iterations="" interval="":
    #!/usr/bin/env sh
    set -e

    iterations={{iterations}}
    interval={{interval}}

    echo "demo: iterations=$iterations interval=$interval"

    # Create identity A (test1) outside the loop for tracking and testing
    dfx identity use test1
    principal_test1=$(dfx identity get-principal)
    echo "test1 principal: $principal_test1"

    # Airdrop to test1 so it has funds to send
    echo "airdropping to test1"
    just dfx_local_airdrop $principal_test1

    for i in `seq 1 $iterations`; do
      idname="demo_$i"
      echo "--- iteration $i: creating identity $idname"

      # create identity (idempotent)
      principal=$(dfx identity get-principal --identity $idname)
      echo "principal: $principal"

      # airdrop to the new identity
      echo "airdropping to $principal"
      just dfx_local_airdrop $principal

      r=$((RANDOM % 2))

      amount=$(awk 'BEGIN { srand(); min=1; max=5; r = min + rand()*(max-min); printf "%d", int(r * 1e8) }')
          if [ "$r" -eq 0 ]; then
            echo "transfer: $idname -> test1"
            dfx identity use $idname
      dfx canister call icp_ledger_canister icrc1_transfer "(record { to = record { owner = principal \"$principal_test1\"; subaccount = null; }; memo = null; created_at_time = null; from_subaccount = null; amount = $amount; fee = null })"
          else
            echo "transfer: test1 -> $idname"
            dfx identity use test1
      dfx canister call icp_ledger_canister icrc1_transfer "(record { to = record { owner = principal \"$principal\"; subaccount = null; }; memo = null; created_at_time = null; from_subaccount = null; amount = $amount; fee = null })"
          fi

      echo "iteration $i complete"
      sleep $interval
    done

    # leave the active identity as test1 for frontend testing
    echo "switching to test1 for testing"
    dfx identity use test1
