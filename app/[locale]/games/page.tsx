import prisma from "@/app/lib/db";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from 'next-intl';

// ... (getActiveGames function remains the same) ...

export const metadata = {
  title: 'Available Games - Roll to Help',
  description: 'Browse available tabletop game sessions for our charity auction.',
};

export default async function GamesPage() {
  const games = await getActiveGames();
  const t = useTranslations('GamesPage');

  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <main className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-purple-900 mb-12">Available Games</h1>

        {games.length === 0 ? (
          <p className="text-center text-gray-600">{t('noGamesMessage')}</p> 
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* ... (mapping over games remains the same) ... */}
          </div>
        )}
      </main>
    </div>
  );
}

// ... (revalidate remains the same) ... 