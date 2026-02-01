"use client";

import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuth() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  const convexUser = useQuery(
    api.users.getCurrent,
    isSignedIn ? {} : "skip"
  );

  return {
    user: convexUser,
    clerkUser,
    isLoaded: isClerkLoaded && (isSignedIn ? convexUser !== undefined : true),
    isSignedIn: isSignedIn ?? false,
    signOut,
  };
}
