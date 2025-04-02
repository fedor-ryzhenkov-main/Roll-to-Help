import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ru', 'ka'], // Your existing locales

  // Used when no locale matches
  defaultLocale: 'en' // Your default locale
}); 