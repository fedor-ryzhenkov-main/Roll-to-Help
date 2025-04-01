'use client'; // This directive makes it a Client Component

import { SessionProvider } from "next-auth/react";
import React from "react";

// Create a client component wrapper for SessionProvider
export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
} 