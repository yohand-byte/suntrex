import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import pl from './locales/pl.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import el from './locales/el.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
      pl: { translation: pl },
      fr: { translation: fr },
      it: { translation: it },
      el: { translation: el },
    },
    fallbackLng: 'en',
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'locale',
      lookupLocalStorage: 'locale',
      cookieMinutes: 525600, // 1 year
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
