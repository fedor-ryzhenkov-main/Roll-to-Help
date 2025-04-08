import Link from 'next/link';

// In Next.js 15, the searchParams prop is a promise when the component is async
type ErrorProps = {
  searchParams?: { 
    error?: string;
    callbackUrl?: string;
  } | Promise<{
    error?: string;
    callbackUrl?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: ErrorProps) {
  // Await searchParams to access its properties
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  const callbackUrl = resolvedParams?.callbackUrl || '/';
  const errorMessage = getErrorMessage(error);

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Ошибка аутентификации</h1>
          <p className="text-gray-600">
            Произошла ошибка при обработке вашего запроса
          </p>
        </div>
        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            {errorMessage}
          </div>
          <div className="flex justify-center">
            <Link 
              href={callbackUrl} 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Вернуться назад
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error?: string): string {
  switch (error) {
    case 'Signin':
      return 'Попробуйте войти снова или используйте другой метод входа.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'OAuthAccountNotLinked':
      return 'Произошла ошибка при входе через внешний сервис. Пожалуйста, попробуйте снова.';
    case 'Callback':
      return 'Произошла ошибка при обработке вашего входа. Пожалуйста, попробуйте снова.';
    case 'CredentialsSignin':
      return 'Неверные данные для входа. Пожалуйста, проверьте введенную информацию.';
    case 'SessionRequired':
      return 'Для доступа к этой странице необходима авторизация. Пожалуйста, войдите в систему.';
    default:
      return 'Произошла неизвестная ошибка. Пожалуйста, попробуйте снова позже.';
  }
} 