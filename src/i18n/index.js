import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const localeModules = import.meta.glob('./locales/*/*.json', { eager: true });
const supportedLngs = ['fr', 'en', 'de', 'es', 'it', 'pl', 'el'];
const namespaces = ['translation', 'common', 'homepage', 'catalog', 'auth', 'dashboard', 'delivery', 'chat', 'pages'];

function buildLegacyTranslation(nsData) {
  return {
    ...(nsData.common || {}),
    home: nsData.homepage || {},
    ...(nsData.catalog || {}),
    auth: nsData.auth || {},
    dashboard: nsData.dashboard || {},
    delivery: nsData.delivery || {},
    chat: nsData.chat || {},
  };
}

const resources = supportedLngs.reduce((acc, lang) => {
  const nsData = {};

  Object.entries(localeModules).forEach(([filePath, module]) => {
    const match = filePath.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match || match[1] !== lang) return;
    nsData[match[2]] = module.default || module;
  });

  acc[lang] = {
    translation: buildLegacyTranslation(nsData),
    common: nsData.common || {},
    homepage: nsData.homepage || {},
    catalog: nsData.catalog || {},
    auth: nsData.auth || {},
    dashboard: nsData.dashboard || {},
    delivery: nsData.delivery || {},
    chat: nsData.chat || {},
    pages: nsData.pages || {},
  };

  return acc;
}, {});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs,
    ns: namespaces,
    defaultNS: 'translation',
    fallbackNS: 'translation',
    fallbackLng: 'en',
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'locale',
      lookupLocalStorage: 'locale',
      cookieMinutes: 525600,
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
