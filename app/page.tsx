import Link from 'next/link'
import Image from 'next/image'
import prisma from './lib/db'
import { format } from 'date-fns'

// Set dynamic flag to determine if we're in build phase
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Get active event with details
  let activeEvent = null;
  
  try {
    activeEvent = await prisma.event.findFirst({
      where: { isActive: true },
      select: { 
        id: true,
        name: true,
        description: true,
        location: true,
        eventDate: true,
        imageUrl: true
      }
    });
  } catch (error) {
    console.error('Error fetching event data:', error);
    // Continue with null activeEvent - the UI will handle this case
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto">
        {activeEvent ? (
          <>
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-purple-900">
                {activeEvent.name}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-4 max-w-2xl mx-auto">
                {activeEvent.description}
              </p>
              <div className="mt-4 space-y-2 text-gray-700">
                <p>
                  <span className="font-semibold">Where:</span> {activeEvent.location}
                </p>
                <p>
                  <span className="font-semibold">When:</span> {format(activeEvent.eventDate, 'EEEE, MMMM do, yyyy')} at {format(activeEvent.eventDate, 'h:mm a')}
                </p>
              </div>
            </div>
            
            {/* Partner logos with links */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-12">
              <a href="https://choosetohelp.ge/eng" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform">
                <div className="w-24 h-24 overflow-hidden rounded-full border-2 border-orange-200">
                  <Image 
                    src="/choose-to-help-logo.png" 
                    alt="Choose to Help" 
                    width={100} 
                    height={100} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </a>
              <a href="https://www.instagram.com/mesto.tbilisi/?hl=en" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform">
                <div className="w-24 h-24 overflow-hidden rounded-full border-2 border-orange-200">
                  <Image 
                    src="/mesto-logo.png" 
                    alt="Mesto Tbilisi" 
                    width={100} 
                    height={100} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </a>
              <a href="https://t.me/ttrpgs_tbilisi" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform">
                <div className="w-24 h-24 overflow-hidden rounded-full border-2 border-orange-200">
                  <Image 
                    src="/ttrpgs-logo.png" 
                    alt="TTRPGs Tbilisi" 
                    width={100} 
                    height={100} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </a>
            </div>
            
            
            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 mx-auto">
              {/* Container to determine the width based on content */}
              <div className="inline-flex flex-col gap-4 items-center">
                {/* Primary CTA Button */}
                <Link 
                  href="/games" 
                  className="bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold py-4 px-8 rounded-lg shadow-lg transition-all hover:scale-105 text-center whitespace-nowrap"
                >
                  Join Games
                </Link>
                
                {/* Secondary About Us Button */}
                <Link 
                  href="/about" 
                  className="bg-transparent border-2 border-purple-600 text-purple-700 hover:bg-purple-50 text-lg font-medium py-3.5 px-7 rounded-lg transition-colors text-center whitespace-nowrap w-full"
                >
                  About Us
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-purple-900">
              No Adventures Soon
            </h1>
            
            {/* CTA Buttons with About Us as primary */}
            <div className="flex justify-center w-full max-w-md mx-auto">
              {/* Primary About Us Button */}
              <Link 
                href="/about" 
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold py-4 px-8 rounded-lg shadow-lg transition-all hover:scale-105 w-full text-center"
              >
                About Us
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 