"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, User } from "lucide-react";
import dynamic from "next/dynamic";

function UserPlaceholder() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      <User className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

// Dynamically import the Clerk UserButton only when needed
// This prevents the import from happening when Clerk is not configured
const ClerkUserButton = dynamic(
  () =>
    import("@clerk/nextjs").then((mod) => ({
      default: () => (
        <mod.UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      ),
    })),
  {
    ssr: false,
    loading: () => <UserPlaceholder />,
  }
);

export function Header() {
  // Check if Clerk is configured - this is baked in at build time
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search papers, insights, problems..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        {clerkConfigured ? <ClerkUserButton /> : <UserPlaceholder />}
      </div>
    </header>
  );
}
