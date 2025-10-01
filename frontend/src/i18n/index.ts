import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import registrationFr from './locales/fr/registration.json';
import registrationEn from './locales/en/registration.json';
import errorsFr from './locales/fr/errors.json';
import errorsEn from './locales/en/errors.json';
import homeFr from './locales/fr/home.json';
import homeEn from './locales/en/home.json';

const resources = {
    fr: {
        registration: registrationFr,
        errors: errorsFr,
        home: homeFr,
    },
    en: {
        registration: registrationEn,
        errors: errorsEn,
        home: homeEn
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: false,
        fallbackLng: 'fr',
        supportedLngs: ['fr', 'en'],

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false,
        },

        resources,
    }).then();