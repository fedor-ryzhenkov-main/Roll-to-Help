import '../globals.css' // Adjust path
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import NavBar from '@/app/components/NavBar' // Use absolute path
import NextAuthProvider from '@/app/components/NextAuthProvider'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {NextIntlClientProvider, useMessages} from 'next-intl'; // Import i18n provider
import {ReactNode} from 'react';

// ... (Poppins font setup)

// ... (viewport export)

// ... (metadata export - Note: Metadata should ideally be localized too, but keeping simple for now)

type Props = {
  children: ReactNode;
  params: {locale: string};
};


export default async function RootLayout({ 
  children,
  params: {locale} // Get locale from params
}: Props) {
  const session = await getServerSession(authOptions); 
  const messages = useMessages(); // Get messages for the current locale

  return (
    <html lang={locale}> { /* Use locale for lang */ }
      <body className={`${poppins.className} bg-amber-50 flex flex-col min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}> { /* Wrap with i18n provider */ }
          <NextAuthProvider session={session}> 
            <header>
              <NavBar />
            </header>
            
            <main className="flex-grow">
              {children}
            </main>
            
            {/* Footer removed */}
          </NextAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 