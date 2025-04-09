import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-5rem)] py-0">
      <main className="max-w-3xl w-full flex flex-col items-center justify-center h-full py-6">
        
        {/* Top Section: Logo, Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/roll-to-help-logo.png" 
              alt="Roll to Help Logo" 
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-purple-900">
            Roll to Help
          </h1>
          
        </div>

        {/* Middle Section: Info Box & Partners */}
        <div className="flex flex-col items-center w-full mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 inline-block text-left space-y-3">
            <div className="flex items-center">
              <span className="text-purple-600 mr-3 text-xl">📍</span>
              <div>
                <p className="font-semibold text-gray-600">Где</p>
                <p className="text-gray-800">Клуб &quot;MESTO&quot; на Техническом Университете</p>
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

          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            <a href="https://choosetohelp.ge/eng" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform">
              <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-orange-200">
                <Image 
                  src="/choose-to-help-logo.png" 
                  alt="Choose to Help Logo"
                  width={80} 
                  height={80} 
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
            <a href="https://www.instagram.com/mesto.tbilisi/?hl=en" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform">
              <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-orange-200">
                <Image 
                  src="/mesto-logo.png" 
                  alt="Mesto Tbilisi Logo"
                  width={80} 
                  height={80} 
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
            <a href="https://t.me/ttrpgs_tbilisi" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform">
              <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-orange-200">
                <Image 
                  src="/ttrpgs-logo.png" 
                  alt="TTRPGs Tbilisi Logo"
                  width={80} 
                  height={80} 
                  className="w-full h-full object-contain"
                />
              </div>
            </a>
          </div>

          <p className="mt-4 text-lg text-gray-600">
            Присоединяйтесь к благотворительному аукциону настольных игр от клуба
            <a href="https://vk.com/igroteka" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-800 font-semibold">
               &quot;Игротека&quot;
            </a>
             в пользу фонда &quot;Добрый День&quot;.
          </p>
        </div>

        {/* Bottom Button */}
        <div className="flex flex-col sm:flex-row justify-center">
          <Link 
            href="/games"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            Участвовать в аукционе
          </Link>
        </div>

      </main>
    </div>
  );
} 