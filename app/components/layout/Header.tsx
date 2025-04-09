'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Import useSession and signOut
import { Button } from '@/app/components/ui/Button';
import { LogIn, LogOut, UserCircle } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  // Use the useSession hook from next-auth
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLoading = status === 'loading';
  const user = session?.user; // User object is nested under session.user

  console.log(`[Header] Rendering. Auth status: ${status}, User:`, user);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Use signOut from next-auth
      await signOut({ redirect: true, callbackUrl: '/' }); // Redirect to home after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally show an error toast
      setIsLoggingOut(false);
    }
    // No need to setIsLoggingOut(false) on success because of redirect
  };

  return (
    <header className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md fixed top-0 left-0 right-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity">
          Roll to Help
        </Link>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="text-sm">Загрузка...</span>
            </div>
          ) : user ? (
            // User is logged in
            <div className="flex items-center space-x-3">
              <span className="text-sm hidden sm:inline">
                Привет, {user.telegramFirstName || user.telegramUsername || 'участник'}!
              </span>
              <UserCircle className="h-6 w-6 text-green-400" />
              <Button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="secondary"
                size="sm"
              >
                <LogOut className="mr-1 h-4 w-4" />
                {isLoggingOut ? 'Выход...' : 'Выйти'}
              </Button>
            </div>
          ) : (
            // User is not logged in
            <Link href="/link-telegram" passHref>
              <Button variant="secondary" size="sm">
                <LogIn className="mr-1 h-4 w-4" />
                Войти через Telegram
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
} 