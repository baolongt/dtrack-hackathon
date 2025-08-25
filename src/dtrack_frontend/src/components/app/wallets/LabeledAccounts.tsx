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
import AddWalletForm from "./AddWalletForm";
import { toIcrcAccount, truncateAccount, truncatePrincipal } from "@/lib/utils";
import { useShallow } from "zustand/shallow";
import { encodeIcrcAccount } from "@dfinity/ledger-icrc";

export function LabeledAccounts() {
  const { accounts: labeledAccounts } = useAccountStore(
    useShallow((s) => {
      return {
        accounts: s.labeledAccounts,
        removeAccount: s.removeAccount,
        removeOffchainAccount: s.removeOffchainAccount,
      };
    })
  );

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
            {labeledAccounts.map((labeledAcc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {labeledAcc.label}
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
