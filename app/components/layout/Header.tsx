'use client';

import Link from 'next/link';
import { useTelegram } from '@/app/context/TelegramContext';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useState } from 'react';
import { apiClient, ApiError } from '@/app/utils/api-client'; // Import apiClient and ApiError
import { toast } from 'react-hot-toast'; // Import toast

export default function Header() {
  // Use router for navigation after logout
  const router = useRouter();
  const { linkedTelegramInfo, isLoading, setLinkedTelegramInfo } = useTelegram(); // Get setLinkedTelegramInfo
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Use apiClient.post instead of fetch
      const result = await apiClient.post<{ success: boolean; error?: string }>('/api/auth/logout'); // POST, no body
      
      // apiClient throws on non-2xx, so reaching here means success
      if (result.success) { 
        console.log('Logout successful');
        setLinkedTelegramInfo(null); 
        router.push('/'); 
        router.refresh();
      } else {
        // Handle cases where API returns 2xx but { success: false }
        console.error("Logout API returned success:false:", result.error || 'Unknown error');
        toast.error(result.error || 'Ошибка выхода'); // Show error toast
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Handle ApiError or other errors
      let message = 'Ошибка выхода';
      if (error instanceof ApiError) {
        message = error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message); // Show error toast
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Log the state received from context before rendering
  console.log('[Header] Rendering. isLoading:', isLoading, 'linkedTelegramInfo:', linkedTelegramInfo);

  return (
    <header className="bg-white text-purple-900 shadow-md fixed top-0 left-0 right-0 z-10">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold hover:text-purple-700 transition-colors">
            Roll to Help
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/games" className="font-medium hover:text-purple-700 transition-colors px-4 py-2 rounded-md flex items-center">
              Игры
            </Link>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* Conditional Login/User display - check loading state first */} 
          <div className="text-right"> 
            {isLoading ? (
              // Render nothing or a subtle loading placeholder while loading
              <span className="text-sm opacity-50 px-4 py-2">Загрузка...</span> 
            ) : linkedTelegramInfo ? (
              // Render linked info if not loading and info exists
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-900 px-4 py-2 rounded-md">
                  <span className="mr-2 text-sm">Связан:</span>
                  <span className="font-medium text-sm">@{linkedTelegramInfo.telegramFirstName || 'Пользователь'}</span>
                </span>
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isLoggingOut ? 'Выход...' : 'Выйти'}
                </button>
              </div>
            ) : (

              <Link href="/link-telegram" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block">
                Войти
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
} 