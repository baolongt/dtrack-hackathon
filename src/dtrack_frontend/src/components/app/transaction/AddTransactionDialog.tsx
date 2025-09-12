import * as React from "react";
import { TX_LABELS } from "@/lib/const";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// use native date input instead of the DatePicker
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

type NewTx = {
  date: string;
  label: string;
  amount: string;
  account?: string;
  productTag?: string;
};

export default function AddTransactionDialog({
  newTx,
  setNewTx,
  isCreating,
  onCreate,
  accounts,
}: {
  newTx: NewTx;
  setNewTx: (v: NewTx) => void;
  isCreating: boolean;
  onCreate: (e?: React.FormEvent) => Promise<void>;
  accounts: { id: string; name: string; productTag: string }[];
}) {
  const [open, setOpen] = React.useState(false);


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await onCreate();
      setOpen(false);
  // reset form handled by caller (hook) but keep fallback
  setNewTx({ date: "", label: "", amount: "", account: "", productTag: "" });
    } catch (err) {
      // onCreate already handles errors/alerts; keep dialog open on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Off-chain transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-full max-h-[70vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Off-chain Transaction</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 w-full text-sm"
        >
          <div className="flex flex-col w-full">
            <label className="text-xs text-muted-foreground mb-1">Date</label>
            <Input
              type="date"
              value={newTx.date}
              onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
              className="w-full py-1"
              required
            />
          </div>

          <div className="flex flex-col w-full">
            <label className="text-xs text-muted-foreground mb-1">
              Amount (USD)
            </label>
            <Input
              type="number"
              step="0.01"
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              className="w-full py-1"
              required
            />
          </div>

          <div className="flex flex-col w-full">
            <label className="text-xs text-muted-foreground mb-1">Label</label>
            <Select
              value={newTx.label}
              onValueChange={(v) => setNewTx({ ...newTx, label: v })}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select a label" />
              </SelectTrigger>
              <SelectContent>
                {TX_LABELS.map((l) => (
                  <SelectItem value={l} key={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col w-full">
            <label className="text-xs text-muted-foreground mb-1">Account</label>
            <Select
              value={newTx.account}
              onValueChange={(v) => {
                const acct = accounts.find((a) => a.id === v) ?? null;
                setNewTx({ ...newTx, account: v, productTag: acct ? acct.productTag : "" });
              }}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem value={a.id} key={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col w-full">
            <label className="text-xs text-muted-foreground mb-1">Product Tag</label>
            <Input
              value={newTx.productTag || ""}
              readOnly
              className="w-full py-1 bg-muted/10"
              placeholder="Auto-populated from selected account"
            />
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <Button
              type="submit"
              size="sm"
              disabled={isCreating}
              className="px-3 py-1"
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isCreating}
              className="px-3 py-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
