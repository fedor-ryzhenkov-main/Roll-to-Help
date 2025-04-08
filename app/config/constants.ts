/**
 * Application-wide constants
 */


export const AUTH = {
  SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  VERIFICATION_CODE_LENGTH: 6,
  VERIFICATION_CODE_EXPIRY: 15 * 60 * 1000, // 15 minutes in milliseconds
};


export const API = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  DEFAULT_RATE_LIMIT: 100, // requests per minute
  HIGH_SECURITY_RATE_LIMIT: 20, // requests per minute for sensitive endpoints
  POLLING_INTERVAL: 5000, // default polling interval (ms)
};


export const DATE_FORMATS = {
  DISPLAY_DATE: 'dd MMM yyyy',
  DISPLAY_DATETIME: 'dd MMM yyyy HH:mm',
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
};


export const UI = {
  ANIMATION_DURATION: 300, // ms
  TOAST_DURATION: 5000, // ms
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },
};

export const CURRENCY_SYMBOL = '₾';
