'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiClient } from '@/app/utils/api-client'; // Import apiClient

// Define the shape of the User info we store in context
// Align this with the data returned by /api/auth/me
interface UserInfo {
    id: string;
    telegramFirstName?: string | null;
    telegramUsername?: string | null;
    isVerified?: boolean;
    isAdmin?: boolean;
    telegramId?: string | null;
    // Add other fields returned by /api/auth/me if needed
}

// Define the context shape
interface TelegramContextType {
    linkedTelegramInfo: UserInfo | null;
    setLinkedTelegramInfo: (info: UserInfo | null) => void;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create the context with a default value
const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

// Create the provider component
interface TelegramProviderProps {
    children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
    // Initialize state to null, loading to true
    const [linkedTelegramInfo, setLinkedTelegramInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); 

    // Effect to fetch user status from server on initial load
    useEffect(() => {
        const fetchUserStatus = async () => {
            setIsLoading(true);
            console.log('TelegramProvider: Fetching /api/auth/me');
            try {
                // Ensure credentials (cookies) are sent with the request
                const response = await apiClient.get('auth/me', { credentials: 'include' }); 
                if (response.success && response.data?.user) {
                    console.log('TelegramProvider: User data received:', response.data.user);
                    setLinkedTelegramInfo(response.data.user);
                } else {
                    console.log('TelegramProvider: No active session found or user data missing.');
                    setLinkedTelegramInfo(null); // Ensure state is null if not authenticated
                }
            } catch (error: any) {
                if (error.status !== 401) {
                    console.error("Error fetching user status from /api/auth/me:", error);
                } else {
                    console.log('TelegramProvider: /api/auth/me returned 401 (Not Authenticated).');
                }
                setLinkedTelegramInfo(null); // Clear state on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserStatus();
    }, []); // Empty dependency array ensures this runs only once on mount

    // ADDED: Effect to log changes to linkedTelegramInfo
    useEffect(() => {
      console.log('[TelegramProvider] linkedTelegramInfo changed:', linkedTelegramInfo);
    }, [linkedTelegramInfo]);

    // NOTE: We no longer save to localStorage here.
    // State is derived from the session cookie via /api/auth/me on load,
    // and updated directly by the login component after WS message.

    return (
        <TelegramContext.Provider value={{ linkedTelegramInfo, setLinkedTelegramInfo, isLoading, setIsLoading }}>
            {children}
        </TelegramContext.Provider>
    );
};

// Create a custom hook for easy context usage
export const useTelegram = (): TelegramContextType => {
    const context = useContext(TelegramContext);
    if (context === undefined) {
        throw new Error('useTelegram must be used within a TelegramProvider');
    }
    return context;
}; 