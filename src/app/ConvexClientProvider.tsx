"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

function ConvexProviderWrapper({
  children,
  convex,
}: {
  children: ReactNode;
  convex: ConvexReactClient | null;
}) {
  const auth = useAuth();

  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={() => auth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const convex = useMemo(() => {
    if (!convexUrl) {
      return null;
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  // If Clerk key is not available, render without providers (for build time)
  if (!clerkKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProviderWrapper convex={convex}>{children}</ConvexProviderWrapper>
    </ClerkProvider>
  );
}
