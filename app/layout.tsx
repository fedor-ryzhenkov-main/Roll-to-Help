import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import NavBar from './components/NavBar'
import NextAuthProvider from './components/NextAuthProvider'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-amber-50 flex flex-col min-h-screen`}>
        <NextAuthProvider>
          <header>
            <NavBar />
          </header>
          
          <main className="flex-grow">
            {children}
          </main>
          
          <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-between">
                <div className="w-full md:w-1/3 mb-6 md:mb-0">
                  <h3 className="text-xl font-bold mb-2">Roll to Help</h3>
                  <p className="text-gray-300">Supporting charities through tabletop gaming events.</p>
                </div>
                <div className="w-full md:w-1/3 mb-6 md:mb-0">
                  <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
                  <ul className="space-y-2">
                    <li><a href="/" className="text-gray-300 hover:text-white">Home</a></li>
                    <li><a href="/games" className="text-gray-300 hover:text-white">Games</a></li>
                    <li><a href="/about" className="text-gray-300 hover:text-white">About Us</a></li>
                  </ul>
                </div>
                <div className="w-full md:w-1/3">
                  <h3 className="text-lg font-semibold mb-2">Contact</h3>
                  <p className="text-gray-300">Email: info@rolltohelp.com</p>
                  <p className="text-gray-300">Telegram: @RollToHelpBot</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-300 text-sm">
                &copy; {new Date().getFullYear()} Roll to Help. All rights reserved.
              </div>
            </div>
          </footer>
        </NextAuthProvider>
      </body>
    </html>
  )
} 