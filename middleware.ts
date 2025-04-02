import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing'; // Import from the new location

export default createMiddleware(routing); // Pass routing config

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // Adjust matcher as needed, this is a common default
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] 
}; 