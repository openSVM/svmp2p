module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt'],
    localePath: './public/locales',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'profile', 'trading', 'onboarding'],
  },
  fallbackLng: 'en',
  debug: false,
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};