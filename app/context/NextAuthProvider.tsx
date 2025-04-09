'use client'; // This component must be a Client Component

import { SessionProvider } from "next-auth/react";
import React from "react";

interface NextAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Wrapper component to provide the NextAuth session context to client components.
 */
export default function NextAuthProvider({ children }: NextAuthProviderProps) {
  // The SessionProvider component from next-auth/react handles fetching/providing session state
  return <SessionProvider>{children}</SessionProvider>;
} 