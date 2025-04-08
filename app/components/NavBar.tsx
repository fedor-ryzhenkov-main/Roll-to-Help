'use client';

import Link from 'next/link';
import { useTelegram } from "@/app/context/TelegramContext";
import { Button } from "@/app/components/ui";
import { apiClient } from "@/app/utils/api-client";
import { toast } from "react-hot-toast";
import { useState } from "react";

export default function NavBar() {
  const { linkedTelegramInfo, isLoading, setLinkedTelegramInfo } = useTelegram();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await apiClient.post('/api/auth/logout');
      
      if (response.success) {
        console.log("Logout successful on server.");
        toast.success('Вы успешно вышли.');
      } else {
        console.error("Server logout failed:", response.message);
        toast.error('Ошибка выхода из системы.');
      }
    } catch (error) {
      console.error("Error calling logout API:", error);
      toast.error('Ошибка связи при выходе.');
    } finally {
      setLinkedTelegramInfo(null);
      setIsLoggingOut(false);
      console.log("User logged out (cleared local state).");
    }
  };

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
          ) : linkedTelegramInfo ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-sm hidden sm:inline">
                Привет, {linkedTelegramInfo.firstName || linkedTelegramInfo.username || 'User'}!
                {linkedTelegramInfo.username && (
                  <span className="ml-1 text-green-600">(✅ @{linkedTelegramInfo.username})</span>
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