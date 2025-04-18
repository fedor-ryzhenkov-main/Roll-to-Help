'use client';

import { useSearchParams } from 'next/navigation';
import TelegramLogin from '@/app/components/auth/TelegramLogin';

export default function LinkTelegramPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-purple-900 mb-8">Подключение Telegram</h1>
          
          <div className="mb-8">
            <TelegramLogin callbackUrl={callbackUrl} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">Как это работает</h2>
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-gray-700">
                <span className="font-medium">Получите код</span> на этой странице
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Отправьте код</span> нашему Telegram боту
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Нажмите на ссылку для входа</span>, которую получите в Telegram
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Начните участвовать</span> в благотворительном аукционе настольных игр!
              </li>
            </ol>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">Зачем подключать Telegram?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-gray-700">
                  <strong>Участие в аукционе:</strong> Участвуйте в благотворительном аукционе настольных игр.
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-gray-700">
                  <strong>Мгновенные уведомления:</strong> Получайте оповещения, когда вас перебивают или вы выигрываете аукцион.
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-gray-700">
                  <strong>Безопасная верификация:</strong> Гарантия того, что все участники — реальные люди.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 