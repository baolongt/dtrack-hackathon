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
import { SquarePlus } from "lucide-react";

export default function AddProductDialog({
  onAdded,
}: {
  onAdded?: (product: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async () => {
    if (!value) return;
    setLoading(true);
    try {
      setOpen(false);
      setValue("");
      onAdded && onAdded(value);
    } catch (e) {
      alert("Failed to add product: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-2 w-2">
          <SquarePlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="product-input"
          >
            Product
          </label>
          <Input
            id="product-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Personal"
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
