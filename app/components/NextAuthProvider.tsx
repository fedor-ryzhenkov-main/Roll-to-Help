'use client'; // This directive makes it a Client Component

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth"; // <-- Import Session type
import React from "react";

interface NextAuthProviderProps {
  children: React.ReactNode;
  session: Session | null; // <-- Accept session prop
}

// Create a client component wrapper for SessionProvider
export default function NextAuthProvider({ children, session }: NextAuthProviderProps) { // <-- Destructure session
  // Pass the session prop to SessionProvider
  return <SessionProvider session={session}>{children}</SessionProvider>;
} 