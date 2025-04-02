'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-red-600">Что-то пошло не так!</h1>
        
        <p className="text-lg text-gray-700 mb-8">
          Приносим извинения за неудобства. Произошла непредвиденная ошибка.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
          
          <Link 
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
} 