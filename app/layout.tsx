import './globals.css'
import { Poppins } from 'next/font/google'
import { TelegramProvider } from './context/TelegramContext'
import Header from './components/layout/Header'
import { Toaster } from 'react-hot-toast';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'Игротека',
  description: 'Благотворительная игротека настольных игр',
  icons: {
    icon: '/roll-to-help-logo.png',
    apple: '/roll-to-help-logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${poppins.className} flex flex-col min-h-screen`} 
            style={{
              background: 'linear-gradient(to bottom, #ede9f6 0%, #eae4f4 20%, #e6dfef 40%, #ece5e0 60%, #f0ebd1 80%, #f5ecb5 100%)'
            }}>
        <TelegramProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 pt-20">
            {children}
          </main>
          <Toaster position="bottom-center" />
        </TelegramProvider>
      </body>
    </html>
  );
} 