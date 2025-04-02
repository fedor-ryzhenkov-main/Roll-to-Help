import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize asset loading
  poweredByHeader: false,
  
  // Disable ESLint and TypeScript checking during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // External packages that should be processed by the server
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Combined experimental settings
  experimental: {
    // For build caching
    turbotrace: {
      logLevel: 'error',
    },
    // Enable build caching
    outputFileTracingRoot: __dirname,
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
    // Disable static generation for pages that would require database access
    // during the build phase, ensuring we only access the database at runtime
  }
}

export default nextConfig; 