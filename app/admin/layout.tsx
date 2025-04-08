'use client';

import { ReactNode, useEffect } from 'react';
import { useTelegram } from '@/app/context/TelegramContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { linkedTelegramInfo, isLoading } = useTelegram();
  const router = useRouter();

  // Check auth state after loading and context hydration
  useEffect(() => {
    // Only redirect if loading is complete
    if (!isLoading) {
        if (!linkedTelegramInfo?.isAdmin) {
            console.warn('[AdminLayout] Access denied. User not admin or not logged in.');
            router.replace('/'); // Redirect non-admins to home page
        } else {
            console.log('[AdminLayout] Admin access granted.');
        }
    }
  }, [isLoading, linkedTelegramInfo, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading admin section...</p>
      </div>
    );
  }

  // If user IS admin (and loading is done), render the layout and page content
  if (linkedTelegramInfo?.isAdmin) {
    return (
      <div>
        <nav className="bg-purple-800 text-white p-4 mb-6 rounded-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            {/* Add admin navigation links here */}
            <div className="space-x-4">
              <Link href="/admin" className="px-3 py-1 hover:bg-purple-700 rounded">Dashboard</Link> {/* Example Link */}
              <Link href="/admin/games/create" className="px-3 py-1 hover:bg-purple-700 rounded">Create Game</Link>
              <Link href="/admin/games" className="px-3 py-1 hover:bg-purple-700 rounded">View Games</Link> {/* Example Link */}
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    );
  }

  // If user is NOT admin (and loading is done), show access denied (redirect handled by useEffect)
  // This state might be briefly visible before redirect completes
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <p className="text-red-500 font-semibold">Access Denied</p>
    </div>
  );
}