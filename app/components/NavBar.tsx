'use client';

import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/app/components/ui";
import { toast } from "react-hot-toast";
import { useState } from "react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && session?.user;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success('Вы успешно вышли.');
    } catch (error) {
      console.error("Error during sign out:", error);
      toast.error('Ошибка выхода из системы.');
    } finally {
      setIsLoggingOut(false);
      console.log("User logged out.");
    }
  };

  // Get user display info from session
  const userDisplayName = 
    session?.user?.telegramFirstName || 
    session?.user?.telegramUsername || 
    'User';
  
  const telegramUsername = session?.user?.telegramUsername;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm py-3 px-4 sm:px-6 lg:px-8 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-purple-900">
          Roll to Help
        </Link>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link href="/games" className="text-gray-700 hover:text-purple-600 transition-colors">
            Аукцион
          </Link>
          {isLoading ? (
            <span className="text-sm text-gray-500">Загрузка...</span>
          ) : isAuthenticated ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-sm hidden sm:inline">
                Привет, {userDisplayName}!
                {telegramUsername && (
                  <span className="ml-1 text-green-600">(✅ @{telegramUsername})</span>
                )}
              </span>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Выход...' : 'Выйти'}
              </Button>
            </div>
          ) : (
            <Link href="/auth/link-telegram">
              <Button size="sm">
                Войти / Связать Telegram
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 