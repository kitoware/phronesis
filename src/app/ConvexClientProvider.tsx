"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

function ConvexProviderWithClerkWrapper({
  children,
  convex,
}: {
  children: ReactNode;
  convex: ConvexReactClient;
}) {
  const auth = useAuth();

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

  // If Convex is not configured, just render children
  if (!convex) {
    return <>{children}</>;
  }

  // If Clerk is not configured, provide Convex without auth
  if (!clerkKey) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  // Both Convex and Clerk are configured
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProviderWithClerkWrapper convex={convex}>
        {children}
      </ConvexProviderWithClerkWrapper>
    </ClerkProvider>
  );
}
