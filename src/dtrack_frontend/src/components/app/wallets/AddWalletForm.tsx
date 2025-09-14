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
import AddProductDialog from "./AddProductDialog";

export function AddWalletForm() {
  const { addAccount, products } = useAccountStore(
    useShallow((s) => ({
      addAccount: s.addAccount,
      products: s.products,
    }))
  );
  // idValue can be either an account-id (hex) or a principal text depending on mode
  const [idValue, setIdValue] = React.useState("");
  const [mode, setMode] = React.useState<"account" | "principal" | "offchain">(
    "principal"
  );
  const [label, setLabel] = React.useState("");
  const [product, setProduct] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = async () => {
    if (!idValue || !label || !product) return;
    setIsAdding(true);
    try {
      // call the appropriate store method depending on input type
      if (mode === "offchain") {
        await useAccountStore.getState().addOffchainAccount(idValue, label, product);
      } else {
        await addAccount(idValue, label, product);
      }
      setIdValue("");
      setLabel("");
      setProduct("");
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Main Account"
                  className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-start gap-2 mb-2">
                  <label className="text-sm font-medium text-foreground">Product</label>
                  <AddProductDialog
                    onAdded={(newProduct) => {
                      if (!newProduct) return;
                      setProduct(newProduct);
                    }}
                  />
                </div>
                <div className="mt-2">
                  <Select value={product} onValueChange={(v) => setProduct(v)}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {(!products || products.length === 0) ? (
                        <SelectItem value="__none" key="__none">No products</SelectItem>
                      ) : (
                        products.map((p) => (
                          <SelectItem value={p} key={p}>{p}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
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
