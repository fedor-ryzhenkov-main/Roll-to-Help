'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define form schema
const telegramLoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

type TelegramLoginFormData = z.infer<typeof telegramLoginSchema>;

export default function TelegramLogin() {
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<TelegramLoginFormData>({
    resolver: zodResolver(telegramLoginSchema),
  });
  
  const onSubmit = async (data: TelegramLoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate verification code');
      }
      
      setVerificationCode(result.verificationCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-purple-900 mb-6">Login with Telegram</h2>
      
      {verificationCode ? (
        <div className="text-center">
          <p className="mb-4">Your verification code:</p>
          <div className="bg-amber-50 p-4 rounded-md mb-6">
            <span className="text-2xl font-mono font-bold tracking-wider">{verificationCode}</span>
          </div>
          <ol className="text-left mb-6 space-y-2">
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
              <span>Open Telegram and search for <a href="https://t.me/RollToHelpBot" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-medium">@RollToHelpBot</a></span>
            </li>
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
              <span>Start the bot by clicking "Start" or typing /start</span>
            </li>
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
              <span>Send your verification code to the bot</span>
            </li>
          </ol>
          <button
            onClick={() => setVerificationCode(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Try again with a different username
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Enter your username
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your username (at least 3 characters)"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Generate Verification Code'
            )}
          </button>
          
          <div className="text-sm text-gray-500 mt-4">
            <p>You&apos;ll generate a code that you&apos;ll send to our Telegram bot to verify your account.</p>
          </div>
        </form>
      )}
    </div>
  );
} 