import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import fetch from "isomorphic-fetch";
import { canisterId, createActor } from "../../../../declarations/dtrack_backend/index";
import { canisterId as ledgerCanisterId, createActor as ledgerCreateActor } from "../../../../declarations/icp_ledger_canister/index";
import { Principal } from "@dfinity/principal";
import { truncatePrincipal, icpToUsd } from "../../lib/utils";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";

export interface LabeledAccount {
  owner: string;
  label: string;
  balance: number;
}

export function LabeledAccounts() {
  const actor = createActor(canisterId, {
    agentOptions: {
      fetch,
      host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:8080' : 'https://ic0.app',
      shouldFetchRootKey: true,
    }
  })

  const ledgerActor = ledgerCreateActor(ledgerCanisterId, {
    agentOptions: {
      fetch,
      host: process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:8080' : 'https://ic0.app',
      shouldFetchRootKey: true,
    }
  })

  const labeledAccounts: LabeledAccount[] = Array.from([])
  const [accounts, setAccounts] =
    React.useState<LabeledAccount[]>(labeledAccounts);

  React.useEffect(() => {
    async function fetchAccounts() {
      try {
        const result = await actor.get_labeled_accounts();
        let accounts: LabeledAccount[] = [];

        if ("Ok" in result) {
          accounts = result.Ok.map(addr => ({
            owner: addr.account.owner.toText(),
            label: addr.label,
            balance: 0,
          }));
        } else {
          console.error("Failed to fetch accounts:", result.Err);
        }

        const balances = await Promise.all(
          accounts.map(async (account) => {
            try {
              const balance = await ledgerActor.icrc1_balance_of({
                owner: Principal.fromText(account.owner),
                subaccount: [],
              });
              const decimals = await ledgerActor.icrc1_decimals();
              return icpToUsd(Number(balance / BigInt(10**decimals)));
            } catch {
              return 0;
            }
          })
        );

        const accountsWithBalances = accounts.map((acc, i) => ({
          ...acc,
          balance: balances[i],
        }));
        setAccounts(accountsWithBalances);
      } catch (e) {
        console.error("Failed to fetch accounts", e);
      }
    }
    fetchAccounts();
  }, []);

  const [newOwner, setNewOwner] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddAccount = async () => {
    if (newOwner && setNewOwner) {
      setIsAdding(true);
      try {
        await actor.create_labeled_account({
          label: newLabel,
          account: {
            owner: Principal.fromText(newOwner),
            subaccount: [],
          }
        });

        let balance = 0;
        try {
          balance = icpToUsd(Number(
            await ledgerActor.icrc1_balance_of({
              owner: Principal.fromText(newOwner),
              subaccount: [],
            }) / BigInt(10**(await ledgerActor.icrc1_decimals()))
          ));
        } catch {
          balance = 0;
        }

        const newLabeledAccount: LabeledAccount = {
          owner: newOwner,
          label: newLabel,
          balance,
        };
        setAccounts([...accounts, newLabeledAccount]);
        setNewOwner("");
        setNewLabel("");
      } catch (e) {
        alert("Failed to add account: " + e)
      } finally {
        setIsAdding(false);
      }
    }
  };

  const [removingAccount, setRemovingAccount] = React.useState<string | null>(null);
  const removeAccount = async (owner: string) => {
    setRemovingAccount(owner);
    try {
      await actor.delete_labeled_account({
        owner: Principal.fromText(owner),
        subaccount: [],
      });
      setAccounts(accounts.filter((acc) => acc.owner !== owner));
    } catch (e) {
      alert("Failed to delete account" + e);
    } finally {
      setRemovingAccount(null)
    }
  };

  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null);

  const handleCopy = (owner: string) => {
    navigator.clipboard.writeText(owner);
    setCopiedAccount(owner);
    setTimeout(() => {
      setCopiedAccount((prev) => (prev === owner ? null : prev));
    }, 1000);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Account</CardTitle>
          <CardDescription>
            Track a new account for monitoring transactions and balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Account
                </label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="Enter account address..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Label
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Enter a label..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleAddAccount}
              disabled={!newOwner || !newLabel}
              className="w-full md:w-auto"
            >
              {isAdding ? (
                <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : null}
              {isAdding ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Manage your accounts and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.owner}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {account.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-muted-foreground">
                      {truncatePrincipal(account.owner)}
                    </p>
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1"
                      onClick={() => handleCopy(account.owner)}
                      aria-label="Copy account address"
                    >
                      {copiedAccount === account.owner ? (
                        <span>Copied!</span>
                      ) : (
                        <>
                          <ClipboardCopyIcon className="w-3 h-3" />
                          <span className="sr-only">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">
                      Balance: ${account.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAccount(account.owner)}
                  >
                    {removingAccount === account.owner ? (
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : null}
                    {removingAccount === account.owner ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
