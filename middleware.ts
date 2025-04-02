import createMiddleware from 'next-intl/middleware';
import './i18n'; // Explicitly import config to hint build process

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ru', 'ka'], // ka for Georgian

  // Used when no locale matches
  defaultLocale: 'en'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ka|ru|en)/:path*']
}; 