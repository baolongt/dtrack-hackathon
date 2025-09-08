import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useAccountStore from "@/stores/account.store";
import { useShallow } from "zustand/shallow";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import AddLabelDialog from "./AddLabelDialog";
import BackendService from "@/services/backend.service";

export function AddWalletForm() {
  const { addAccount, labeledAccounts } = useAccountStore(
    useShallow((s) => ({
      addAccount: s.addAccount,
      labeledAccounts: s.labeledAccounts,
    }))
  );
  // labels loaded from backend
  const [labels, setLabels] = React.useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const svc = BackendService.getInstance();
        const res = await svc.getLabels();
        if (!mounted) return;
        // normalize response to string[]
        let out: string[] = [];
        if (Array.isArray(res)) out = res;
        else if (res && typeof res === "object" && (res as any).Ok) out = (res as any).Ok;
        setLabels(out || []);
      } catch (e) {
        console.warn("Failed to load labels", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  // idValue can be either an account-id (hex) or a principal text depending on mode
  const [idValue, setIdValue] = React.useState("");
  const [mode, setMode] = React.useState<"account" | "principal" | "offchain">(
    "principal"
  );
  const [label, setLabel] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    if (!idValue || !label) return;
    setIsAdding(true);
    try {
      // call the appropriate store method depending on input type
      if (mode === "offchain") {
        await useAccountStore.getState().addOffchainAccount(idValue, label);
      } else {
        await addAccount(idValue, label);
      }
      setIdValue("");
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
        <CardTitle>Add New Account</CardTitle>
        <CardDescription>
          Track a new account for monitoring transactions and balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground">
                Input type
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center text-sm">
                  <input
                    type="radio"
                    name="idMode"
                    checked={mode === "principal"}
                    onChange={() => setMode("principal")}
                    className="mr-2"
                  />
                  Principal ID
                </label>
                <label className="inline-flex items-center text-sm">
                  <input
                    type="radio"
                    name="idMode"
                    checked={mode === "account"}
                    onChange={() => setMode("account")}
                    className="mr-2"
                  />
                  Account ID
                </label>
                <label className="inline-flex items-center text-sm">
                  <input
                    type="radio"
                    name="idMode"
                    checked={mode === "offchain"}
                    onChange={() => setMode("offchain")}
                    className="mr-2"
                  />
                  Offchain
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {mode === "principal" ? "Principal ID" : "Account ID"}
                </label>
                <input
                  type="text"
                  value={idValue}
                  onChange={(e) => setIdValue(e.target.value)}
                  placeholder={
                    mode === "principal"
                      ? "ur2tx-mciqf-h4p4b-qggnv-arpsc-s3wui-2blbn-aphly-wzoos-iqjik-hae"
                      : mode === "offchain"
                      ? "example-offchain-id"
                      : "706d348819f5b7316d497da5c9b3aae2816ffebe01943827f6e66839fcb64641"
                  }
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-start gap-2 mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Label
                  </label>
                  <AddLabelDialog onAdded={(newLabel) => {
                    if (!newLabel) return;
                    setLabels((p) => Array.from(new Set([...p, newLabel])));
                    setLabel(newLabel);
                  }} />
                </div>
                <Select value={label} onValueChange={(v) => setLabel(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a label" />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.length === 0 ? (
                      <SelectItem value="__none" key="__none">
                        No labels
                      </SelectItem>
                    ) : (
                      labels.map((l) => (
                        <SelectItem value={l} key={l}>
                          {l}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!idValue || !label}
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
            {isAdding ? "Adding..." : "Add Account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AddWalletForm;
