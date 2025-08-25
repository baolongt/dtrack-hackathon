import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
};

export default function AddTransactionDialog({
  newTx,
  setNewTx,
  isCreating,
  onCreate,
}: {
  newTx: NewTx;
  setNewTx: (v: NewTx) => void;
  isCreating: boolean;
  onCreate: (e?: React.FormEvent) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  const TX_LABELS = ["Subscription", "Invoice Payment", "Refund", "Other"];

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await onCreate();
      setOpen(false);
      // reset form handled by caller (hook) but keep fallback
      setNewTx({ date: "", label: "", amount: "" });
    } catch (err) {
      // onCreate already handles errors/alerts; keep dialog open on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Custom
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Custom Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex flex-col">
            <DatePicker
              value={newTx.date}
              onChange={(iso) => setNewTx({ ...newTx, date: iso || "" })}
              label="Date & Time"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">
              Amount (USD)
            </label>
            <Input
              type="number"
              step="0.01"
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              className="border rounded p-1"
              required
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="text-sm text-muted-foreground">Label</label>
            <Select
              value={newTx.label}
              onValueChange={(v) => setNewTx({ ...newTx, label: v })}
            >
              <SelectTrigger className="w-full">
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

          <DialogFooter className="flex gap-2">
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
