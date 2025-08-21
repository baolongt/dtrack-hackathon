import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounts } from "../../../hooks/useAccounts";

export function AddWalletForm() {
  const { addAccount } = useAccounts();
  const [principal, setPrincipal] = React.useState("");
  const [subaccount, setSubaccount] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    if (!principal || !label) return;
    setIsAdding(true);
    try {
      await addAccount(principal, label, subaccount || undefined);
      setPrincipal("");
      setSubaccount("");
      setLabel("");
    } catch (e) {
      alert("Failed to add wallet: " + e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Wallet</CardTitle>
        <CardDescription>
          Track a new wallet for monitoring transactions and balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Principal
              </label>
              <input
                type="text"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="Principal (e.g. xxxx-...)"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                SubAccount (optional)
              </label>
              <input
                type="text"
                value={subaccount}
                onChange={(e) => setSubaccount(e.target.value)}
                placeholder="Hex subaccount (without 0x or with)"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter a label..."
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!principal || !label}
            className="w-full md:w-auto"
          >
            {isAdding ? (
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
            {isAdding ? "Adding..." : "Add Wallet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AddWalletForm;
