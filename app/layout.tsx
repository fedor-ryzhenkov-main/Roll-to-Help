import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'] 
})

export const metadata: Metadata = {
  title: 'Roll to Help',
  description: 'Bid on tabletop game seats and help raise funds for charity. Join our gaming events that make a difference.',
  keywords: 'charity, tabletop games, TTRPG, auction, gaming event, fundraising',
  authors: [{ name: 'Igroteka Charity Team' }],
  openGraph: {
    title: 'Roll to Help',
    description: 'Bid on tabletop game seats and help raise funds for charity',
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
  themeColor: '#9333ea',
  viewport: {
    width: 'device-width',
    initialScale: 1,
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
        <header className="bg-orange-600 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <a href="/" className="text-2xl font-bold">Roll to Help</a>
          </div>
        </header>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="bg-purple-800 text-white p-4 w-full">
          <div className="container mx-auto text-center">
            <p>© {new Date().getFullYear()} Roll to Help</p>
            <p className="text-sm text-purple-200 mt-1">
              All proceeds go directly to charity. For questions, contact us at <a href="mailto:info@roll-to-help.org" className="underline">info@roll-to-help.org</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
} 