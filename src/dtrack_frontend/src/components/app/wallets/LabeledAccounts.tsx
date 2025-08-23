import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useAccountStore from "@/stores/account.store";
import AddWalletForm from "./AddWalletForm";
import { truncatePrincipal } from "@/lib/utils";
import { useShallow } from "zustand/shallow";
export function LabeledAccounts() {
  const { accounts } = useAccountStore(
    useShallow((s) => {
      return {
        accounts: s.labeledAccounts,
        removeAccount: s.removeAccount,
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
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">
                      Balance: ${account.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
