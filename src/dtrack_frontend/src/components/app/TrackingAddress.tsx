import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrackedAddress {
  id: string;
  address: string;
  label: string;
  balance: number;
  isActive: boolean;
  dateAdded: string;
}

// Mock tracked addresses data
const mockTrackedAddresses: TrackedAddress[] = [
  {
    id: "addr_001",
    address: "1A2B3C4D5E6F7G8H9I0J",
    label: "Main Wallet",
    balance: 15420.75,
    isActive: true,
    dateAdded: "2025-07-20",
  },
  {
    id: "addr_002",
    address: "9Z8Y7X6W5V4U3T2S1R0Q",
    label: "Trading Account",
    balance: 8932.5,
    isActive: true,
    dateAdded: "2025-07-18",
  },
  {
    id: "addr_003",
    address: "5M4N3B2V1C6X7Z8A9S0D",
    label: "Cold Storage",
    balance: 45678.9,
    isActive: false,
    dateAdded: "2025-07-15",
  },
  {
    id: "addr_004",
    address: "3Q2W1E4R5T6Y7U8I9O0P",
    label: "DeFi Protocol",
    balance: 2156.25,
    isActive: true,
    dateAdded: "2025-07-12",
  },
];

export function TrackingAddress() {
  const [addresses, setAddresses] =
    React.useState<TrackedAddress[]>(mockTrackedAddresses);
  const [newAddress, setNewAddress] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");

  const handleAddAddress = () => {
    if (newAddress && newLabel) {
      const newTrackedAddress: TrackedAddress = {
        id: `addr_${Date.now()}`,
        address: newAddress,
        label: newLabel,
        balance: 0,
        isActive: true,
        dateAdded: new Date().toISOString().split("T")[0],
      };
      setAddresses([...addresses, newTrackedAddress]);
      setNewAddress("");
      setNewLabel("");
    }
  };

  const toggleAddressStatus = (id: string) => {
    setAddresses(
      addresses.map((addr) =>
        addr.id === id ? { ...addr, isActive: !addr.isActive } : addr
      )
    );
  };

  const removeAddress = (id: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      {/* Add New Address Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Address</CardTitle>
          <CardDescription>
            Track a new wallet address for monitoring transactions and balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Address
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter wallet address..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Label
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Enter a label..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleAddAddress}
              disabled={!newAddress || !newLabel}
              className="w-full md:w-auto"
            >
              Add Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracked Addresses List */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Addresses</CardTitle>
          <CardDescription>
            Manage your tracked wallet addresses and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {address.label}
                    </h3>
                    <Badge variant={address.isActive ? "default" : "secondary"}>
                      {address.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">
                    {address.address}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">
                      Balance: ${address.balance.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      Added: {new Date(address.dateAdded).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAddressStatus(address.id)}
                  >
                    {address.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAddress(address.id)}
                  >
                    Remove
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
