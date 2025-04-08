'use client';

import React, { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

/**
 * GameLayout - Handles auto-reload after authentication
 * 
 * This component provides a layout for game pages that includes
 * logic to detect and handle authentication redirects.
 */
export default function GameLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // Check if we're returning from authentication
    const isReturningFromAuth = searchParams.get('from') === 'auth';
    
    if (isReturningFromAuth) {
      console.log('Detected return from authentication, cleaning URL...');
      
      // Create new URL without the from=auth parameter
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('from');
      
      const newPath = pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
      
      // Use replaceState to clean the URL without triggering another navigation
      window.history.replaceState(
        {},
        '',
        newPath
      );
    }
  }, [searchParams, pathname, router]);
  
  return (
    <>
      {children}
    </>
  );
} 