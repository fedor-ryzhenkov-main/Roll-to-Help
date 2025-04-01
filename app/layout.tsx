import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import NavBar from './components/NavBar'
import NextAuthProvider from './components/NextAuthProvider'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]/route'

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'] 
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#9333ea',
};

export const metadata: Metadata = {
  title: 'Roll to Help',
  description: 'Bid on tabletop game seats and help raise funds for charity. Join our gaming events that make a difference.',
  keywords: 'charity, tabletop games, TTRPG, auction, gaming event, fundraising',
  authors: [{ name: 'Igroteka Charity Team' }],
  openGraph: {
    title: 'Roll to Help',
    description: 'Bid on tabletop gaming sessions while supporting charity',
    url: 'https://your-domain.com',
    siteName: 'Roll to Help',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${poppins.className} bg-amber-50 flex flex-col min-h-screen`}>
        <NextAuthProvider session={session}>
          <header>
            <NavBar />
          </header>
          
          <main className="flex-grow">
            {children}
          </main>
          
          {/* Footer removed */}
        </NextAuthProvider>
      </body>
    </html>
  )
} 