'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

function AuthSection() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-gray-500 px-4 py-2">Loading...</div>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-xs sm:text-sm truncate">
          <span className="hidden sm:inline">Logged in as </span>
          <span className="font-medium">{session.user.username}</span>
          {session.user.isVerified && session.user.telegramUsername && (
             <span className="ml-1 sm:ml-2 text-green-600">(✅ @{session.user.telegramUsername})</span>
          )}
           {session.user.isVerified && !session.user.telegramUsername && (
             <span className="ml-1 sm:ml-2 text-green-600">(✅ Linked)</span>
          )}
          {!session.user.isVerified && (
             <span className="ml-1 sm:ml-2 text-orange-600">(⚠️ Verify!)</span>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="px-2 py-1 sm:px-3 text-xs sm:text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link href="/link-telegram" passHref>
        <button
          className="inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 whitespace-nowrap"
        >
          <svg className="mr-1 sm:mr-2 -ml-1 w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.526-.097-1.028-.265-1.493A5.001 5.001 0 0010 11z" clipRule="evenodd"></path>
          </svg>
          Login / Link Account
        </button>
    </Link>
  );
}

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-purple-900">
                Roll to Help
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className="border-transparent text-gray-700 hover:text-purple-900 hover:border-purple-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link 
                href="/games" 
                className="border-transparent text-gray-700 hover:text-purple-900 hover:border-purple-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Games
              </Link>
              <Link 
                href="/about" 
                className="border-transparent text-gray-700 hover:text-purple-900 hover:border-purple-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                About
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:ml-6">
            <AuthSection />
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <div className="mr-2">
                 <AuthSection />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/" className="text-gray-700 hover:bg-gray-50 hover:text-purple-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link href="/games" className="text-gray-700 hover:bg-gray-50 hover:text-purple-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setIsMenuOpen(false)}>Games</Link>
            <Link href="/about" className="text-gray-700 hover:bg-gray-50 hover:text-purple-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setIsMenuOpen(false)}>About</Link>
          </div>
        </div>
      )}
    </nav>
  );
} 