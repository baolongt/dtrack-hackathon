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
// use native <label> element because there's no Label component in the UI folder
import BackendService from "@/services/backend.service";

export default function AddLabelDialog({
  onAdded,
}: {
  onAdded?: (label: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async () => {
    if (!value) return;
    setLoading(true);
    try {
      const svc = BackendService.getInstance();
      await svc.addLabel(value);
      setOpen(false);
      setValue("");
      onAdded && onAdded(value);
    } catch (e) {
      alert("Failed to add label: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Label</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="label-input"
          >
            Label
          </label>
          <Input
            id="label-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Wallet-A"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!value || loading}>
            {loading ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
