import React from "react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";

export function LoginButton() {
  const { login, loginStatus, identity, clear } = useInternetIdentity();

  const disabled = loginStatus === "logging-in";

  if (loginStatus === "success" && identity) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="hidden md:inline">
            {identity.getPrincipal().toString().slice(0, 8)}...
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  const text = loginStatus === "logging-in" ? "Logging in..." : "Login";

  return (
    <Button
      onClick={login}
      disabled={disabled}
      variant="default"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogIn className="h-4 w-4" />
      {text}
    </Button>
  );
}
