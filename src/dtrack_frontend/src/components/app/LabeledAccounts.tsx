import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { truncatePrincipal } from "../../lib/utils";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import { useAccounts } from "../../hooks/useAccounts";
import AddWalletForm from "./wallets/AddWalletForm";

export function LabeledAccounts() {
  const { accounts, addAccount, removeAccount } = useAccounts();
  const [newOwner, setNewOwner] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [removingAccount, setRemovingAccount] = React.useState<string | null>(
    null
  );
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null);

  const handleAddAccount = async () => {
    if (newOwner && newLabel) {
      setIsAdding(true);
      try {
        await addAccount(newOwner, newLabel);
        setNewOwner("");
        setNewLabel("");
      } catch (e) {
        alert("Failed to add account: " + e);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleRemoveAccount = async (owner: string) => {
    setRemovingAccount(owner);
    try {
      await removeAccount(owner);
    } catch (e) {
      alert("Failed to delete account: " + e);
    } finally {
      setRemovingAccount(null);
    }
  };

  const handleCopy = (owner: string) => {
    navigator.clipboard.writeText(owner);
    setCopiedAccount(owner);
    setTimeout(() => {
      setCopiedAccount((prev) => (prev === owner ? null : prev));
    }, 1000);
  };

  return (
    <div className="w-full space-y-6">
      <AddWalletForm />

      <Card>
        <CardHeader>
          <CardTitle>Wallet address management</CardTitle>
          <CardDescription>
            Manage your wallets and their current status
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
                    onClick={() => handleRemoveAccount(account.owner)}
                  >
                    {removingAccount === account.owner ? (
                      <svg
                        className="animate-spin h-4 w-4 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    ) : null}
                    {removingAccount === account.owner
                      ? "Removing..."
                      : "Remove"}
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
