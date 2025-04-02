import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-amber-50 to-amber-100 flex flex-col items-center justify-center text-center px-4 py-12">
      <main className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-bold text-purple-900 mb-6">
          Roll to Help
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-xl mx-auto">
          Благотворительная НРИ-игротека в Тбилиси. Все сборы пойдут на помощь Choose to Help, волонтёрской организации занимающейся помощью Украинским беженцам.
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-10 inline-block text-left space-y-4">
          <div className="flex items-center">
            <span className="text-purple-600 mr-3 text-xl">📍</span>
            <div>
              <p className="font-semibold text-gray-600">Где</p>
              <p className="text-gray-800">Клуб "MESTO" на Техническом Университете</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-purple-600 mr-3 text-xl">📅</span>
            <div>
              <p className="font-semibold text-gray-600">Когда</p>
              <p className="text-gray-800">Пятница, 25 Апреля, 18:00</p>
            </div>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
             <div>
              <p className="font-semibold text-gray-600">Телеграм Канал</p>
              <a href="https://t.me/Roll_to_help" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://t.me/Roll_to_help
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link 
            href="/games"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            Смотреть Игры
          </Link>
        </div>
      </main>
    </div>
  );
} 