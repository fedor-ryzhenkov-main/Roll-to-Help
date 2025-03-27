import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back to home link */}
        <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium inline-block mb-8">
          ← Back to Home
        </Link>
        
        {/* Page title */}
        <h1 className="text-4xl font-bold text-purple-900 mb-8">About Roll to Help</h1>
        
        {/* Mission section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Our Mission</h2>
          <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <p className="text-gray-700 mb-4">
              Roll to Help brings together the tabletop gaming community to support meaningful causes. We believe in the power of play to create positive change, connecting gamers who want to make a difference through the hobby they love.
            </p>
            <p className="text-gray-700">
              Our current focus is supporting "Choose to Help," a vital organization that has been providing essential aid to Ukrainian refugees in Georgia. As they prepare to close their operations, our gaming community is rallying to help them one last time.
            </p>
          </div>
        </section>
        
        {/* How it works section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">How It Works</h2>
          <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <p className="text-gray-700 mb-4">
              Our system is simple: experienced Game Masters volunteer to run tabletop roleplaying games, and players bid for seats at these tables. The highest bidders win spots in the games, with all proceeds going directly to our supported charity.
            </p>
            <p className="text-gray-700">
              To participate, browse the available games, find one that interests you, and place a bid using your Telegram username. If you're among the highest bidders when the auction closes, you'll receive a confirmation message with details about the event location, what to bring, and how to complete your payment.
            </p>
          </div>
        </section>
        
        {/* How to help section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">How You Can Help</h2>
          <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <p className="text-gray-700 mb-4">
              <strong>Bid on Games:</strong> The most direct way to support our cause is by bidding on games that interest you. Even if you're new to tabletop roleplaying, our Game Masters will ensure you have a great experience!
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Run a Game:</strong> If you're an experienced Game Master, consider volunteering to run a session at our next event. Contact us via email or Telegram to discuss what game you'd like to offer.
            </p>
            <p className="text-gray-700">
              <strong>Spread the Word:</strong> Follow us on social media and share our events with friends who might be interested in gaming for a good cause.
            </p>
          </div>
        </section>
        
        {/* Partners section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Our Partners</h2>
          <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <p className="text-gray-700 mb-4">
              <strong>Choose to Help:</strong> An organization dedicated to supporting Ukrainian refugees in Georgia with housing, food, medical care, and other essential services.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Mesto:</strong> A welcoming venue in Tbilisi that hosts our events and shares our commitment to community building and social impact.
            </p>
            <p className="text-gray-700">
              <strong>TTRPGs Tbilisi:</strong> A community of tabletop roleplaying game enthusiasts who help coordinate and promote our events.
            </p>
          </div>
        </section>
        
        {/* Contact section */}
        <section>
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Contact Us</h2>
          <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <p className="text-gray-700 mb-4">
              Have questions or want to get involved? We'd love to hear from you!
            </p>
            <p className="text-gray-700">
              Email us at: <a href="mailto:info@roll-to-help.org" className="text-orange-600 hover:underline">info@roll-to-help.org</a>
            </p>
            <p className="text-gray-700 mt-2">
              Join our Telegram channel: <a href="https://t.me/ttrpgs_tbilisi" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">TTRPGs Tbilisi</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
} 