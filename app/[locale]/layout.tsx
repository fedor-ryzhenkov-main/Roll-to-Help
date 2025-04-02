import '../globals.css' 
import Link from 'next/link'
import NavBar from '@/app/components/NavBar' 
import NextAuthProvider from '@/app/components/NextAuthProvider'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {NextIntlClientProvider} from 'next-intl'; 
import { getMessages } from 'next-intl/server';
import {ReactNode} from 'react';
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

type Props = {
  children: ReactNode;
  params: {locale: string};
};


export default async function RootLayout({ 
  children,
  params: {locale} 
}: Props) {
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