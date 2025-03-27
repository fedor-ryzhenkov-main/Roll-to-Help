# Roll to Help

A lightweight web application for hosting charity tabletop gaming events where users can bid on game seats to support charity organizations.

## Features

- **Simple Bidding System**: Users can place bids using just their Telegram username
- **Multiple Games**: Host and manage multiple tabletop games at your charity event
- **Multi-Seat Auctions**: Each game session can have multiple seats available
- **Real-time Updates**: See the current highest bids and winning seats in real-time
- **Mobile-Friendly**: Responsive design works on all devices
- **Vibrant Design**: Fun, colorful interface that reflects the spirit of tabletop gaming

## Technology Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: SQLite for development, PostgreSQL for production
- **ORM**: Prisma for type-safe database access
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/igroteka-auction-site.git
   cd igroteka-auction-site
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. Initialize the database
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run db:seed
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Project Structure

```
igroteka-auction-site/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── about/                # About page
│   ├── games/                # Games pages
│   ├── components/           # React components
│   └── lib/                  # Utility functions and configs
├── prisma/                   # Prisma schema and migrations
├── public/                   # Static assets
└── DEPLOYMENT.md             # Deployment guide
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Digital Ocean.

### Quick Deployment Steps

1. Push your code to a GitHub repository
2. Set up a Digital Ocean App Platform project
3. Configure the environment variables
4. Deploy the application
5. Run database migrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
