export default function Loading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 border-r-4 border-r-transparent mb-6"></div>
        <h2 className="text-2xl font-bold text-purple-900 mb-2">Загрузка...</h2>
        <p className="text-gray-600">Пожалуйста, подождите, пока мы подготовим контент</p>
      </div>
    </div>
  )
} 