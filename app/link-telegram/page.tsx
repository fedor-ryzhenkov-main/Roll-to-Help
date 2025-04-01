import TelegramLogin from '../components/auth/TelegramLogin';

export const metadata = {
  title: 'Login with Telegram - Roll to Help',
  description: 'Connect your Telegram account to participate in our charity tabletop events',
};

export default function LinkTelegramPage() {
  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-purple-900 mb-2">Connect with Telegram</h1>
          <p className="text-center text-gray-600 mb-8">
            Link your Telegram account to place bids and receive notifications about our charity events.
          </p>
          
          <div className="mb-8">
            <TelegramLogin />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">How It Works</h2>
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-gray-700">
                <span className="font-medium">Generate a code</span> on this page
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Send the code</span> to our Telegram bot
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Click the login link</span> you receive in Telegram
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Start bidding</span> on charity tabletop games!
              </li>
            </ol>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">Why Connect with Telegram?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-gray-700">
                  <strong>Bid on Games:</strong> Place bids on charity tabletop gaming sessions.
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-gray-700">
                  <strong>Instant Notifications:</strong> Receive alerts when you're outbid or win an auction.
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-gray-700">
                  <strong>Secure Verification:</strong> Ensure that all participants are real people.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 