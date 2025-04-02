import '../globals.css' 
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import NavBar from '@/app/components/NavBar' 
import NextAuthProvider from '@/app/components/NextAuthProvider'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {NextIntlClientProvider} from 'next-intl'; 
import { getMessages, setRequestLocale } from 'next-intl/server';
import {ReactNode} from 'react';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

type Props = {
  children: ReactNode;
  params: {locale: string};
};

export default async function RootLayout({ 
  children,
  params: {locale} 
}: Props) {
  if (!routing.locales.includes(locale as any)) {
      notFound();
  }
  
  setRequestLocale(locale);
  
  const session = await getServerSession(authOptions); 
  const messages = await getMessages(); 

  return (
    <html lang={locale}> 
      <body className={`${poppins.className} bg-amber-50 flex flex-col min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}> 
          <NextAuthProvider session={session}> 
            <header>
              <NavBar />
            </header>
            
            <main className="flex-grow">
              {children}
            </main>
            
          </NextAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 