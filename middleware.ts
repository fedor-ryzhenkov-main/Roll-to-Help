import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing'; // Import from the new location

// This middleware intercepts requests and handles i18n routing
export default createMiddleware({
  // A list of all locales that are supported
  locales: routing.locales,
  
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: routing.defaultLocale,
  
  // Enable locale detection based on cookies and accept-language header
  localeDetection: true,
  
  // Force redirect from / to defaultLocale to avoid 404 issues
  localePrefix: 'always' // 'as-needed' | 'always' | 'never'
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next/static|_next/image|_vercel|favicon.ico).*)'] 
}; 