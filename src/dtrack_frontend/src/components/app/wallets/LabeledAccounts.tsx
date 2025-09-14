import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useAccountStore from "@/stores/account.store";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import AddWalletForm from "./AddWalletForm";
import { toIcrcAccount, truncateAccount, truncatePrincipal } from "@/lib/utils";
import { useShallow } from "zustand/shallow";
import { encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function LabeledAccounts() {
  const { accounts: labeledAccounts, products, removeProduct } = useAccountStore(
    useShallow((s) => {
      return {
        accounts: s.labeledAccounts,
        removeAccount: s.removeAccount,
        removeOffchainAccount: s.removeOffchainAccount,
        products: s.products,
        removeProduct: s.removeProduct,
      };
    })
  );

  const [query, setQuery] = React.useState("");
  const [productFilter, setProductFilter] = React.useState<string>("__all");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "onchain" | "offchain">("all");

  // products come from the backend-driven product list in the store

  const filtered = React.useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return (labeledAccounts || []).filter((a) => {
      const acc = a as any;
      const label = String(acc.label || "").toLowerCase();
      if (q && !label.includes(q)) return false;

      if (productFilter !== "__all") {
        const p = acc.product ? String(acc.product) : "";
        if (productFilter === "__none") {
          if (p) return false;
        } else {
          if (p !== productFilter) return false;
        }
      }

      if (typeFilter === "onchain") {
        if (!("Icrc1" in acc.account)) return false;
      } else if (typeFilter === "offchain") {
        if (!("Offchain" in acc.account)) return false;
      }

      return true;
    });
  }, [labeledAccounts, query, productFilter, typeFilter]);

  return (
    <div className="w-full space-y-6">
      <AddWalletForm />

      <Card>
        <CardHeader>
          <CardTitle>Account management</CardTitle>
          <CardDescription>
            Manage your accounts and their current status
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:gap-4 w-full mb-2">
              <Input
                placeholder="Search by name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full md:max-w-md"
              />

              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <div className="flex items-center gap-2">
                  <Select value={productFilter} onValueChange={(v) => setProductFilter(v)}>
                    <SelectTrigger className="h-10 w-48">
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all" key="__all">All products</SelectItem>
                      {products && products.length > 0 ? (
                        products.map((p) => (
                          <SelectItem value={p} key={p}>{p}</SelectItem>
                        ))
                      ) : null}
                    </SelectContent>
                  </Select>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Manage products</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Manage Products</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {(!products || products.length === 0) ? (
                          <p className="text-sm text-muted-foreground">No products defined.</p>
                        ) : (
                          products.map((p) => {
                            const count = (labeledAccounts || []).filter(a => (a as any).product === p).length
                            return (
                              <div key={p} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium">{p}</div>
                                  <div className="text-sm text-muted-foreground">Used by {count} account{count !== 1 ? 's' : ''}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={async () => {
                                      // confirm deletion
                                      // eslint-disable-next-line no-restricted-globals
                                      const ok = window.confirm(`Remove product '${p}'? This will not delete accounts.`)
                                      if (!ok) return;
                                      try {
                                        await removeProduct(p)
                                        // if current filter equals deleted product, reset
                                        if (productFilter === p) setProductFilter('__all')
                                      } catch (e) {
                                        window.alert(e instanceof Error ? e.message : String(e))
                                      }
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button>Close</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger className="h-10 w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" key="all">All</SelectItem>
                    <SelectItem value="onchain" key="onchain">Onchain</SelectItem>
                    <SelectItem value="offchain" key="offchain">Offchain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filtered.map((labeledAcc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {labeledAcc.label}
                        {(labeledAcc as any).product ? (
                          <Badge variant="secondary" className="ml-3">
                            {(labeledAcc as any).product}
                          </Badge>
                        ) : null}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-muted-foreground">
                      {"Icrc1" in labeledAcc.account
                        ? truncateAccount((labeledAcc.account as any).Icrc1)
                        : (labeledAcc.account as any).Offchain}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">
                      Balance: ${labeledAcc.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Copy ${labeledAcc.label} principal`}
                    className="flex items-center gap-2 text-foreground/90 hover:underline"
                    onClick={async () => {
                      if ("Icrc1" in labeledAcc.account) {
                        await navigator.clipboard.writeText(
                          encodeIcrcAccount(
                            toIcrcAccount((labeledAcc.account as any).Icrc1)
                          )
                        );
                      } else if ("Offchain" in labeledAcc.account) {
                        await navigator.clipboard.writeText(
                          (labeledAcc.account as any).Offchain
                        );
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="font-medium">Copy</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${labeledAcc.label}`}
                    className="text-red-600 hover:text-red-700"
                    onClick={async () => {
                      // Ask for confirmation before deleting
                      // eslint-disable-next-line no-restricted-globals
                      const ok = window.confirm(
                        `Remove account '${labeledAcc.label}'?`
                      );
                      if (!ok) return;
                      try {
                        let removed = false;
                        if ("Icrc1" in labeledAcc.account) {
                          removed = await useAccountStore
                            .getState()
                            .removeAccount(
                              encodeIcrcAccount(
                                toIcrcAccount((labeledAcc.account as any).Icrc1)
                              )
                            );
                        } else if ("Offchain" in labeledAcc.account) {
                          removed = await useAccountStore
                            .getState()
                            .removeOffchainAccount(
                              (labeledAcc.account as any).Offchain
                            );
                        }
                        if (!removed) {
                          // eslint-disable-next-line no-alert
                          window.alert("Failed to remove account");
                        }
                      } catch (e) {
                        // eslint-disable-next-line no-alert
                        window.alert(
                          e instanceof Error ? e.message : String(e)
                        );
                      }
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
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
