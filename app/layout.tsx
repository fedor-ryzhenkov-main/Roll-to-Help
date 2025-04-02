import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import NavBar from '@/app/components/NavBar'
import NextAuthProvider from '@/app/components/NextAuthProvider'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {ReactNode} from 'react';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Игротека',
  description: 'Благотворительная игротека настольных игр',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru">
      <body className={`${poppins.className} bg-amber-50 flex flex-col min-h-screen`}>
        <NextAuthProvider session={session}>
          <header>
            <NavBar />
          </header>
          
          <main className="flex-grow">
            {children}
          </main>
          
        </NextAuthProvider>
      </body>
    </html>
  )
} 