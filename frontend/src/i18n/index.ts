import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import registrationFr from './locales/fr/registration.json';
import registrationEn from './locales/en/registration.json';

const resources = {
    fr: {
        registration: registrationFr
    },
    en: {
        registration: registrationEn
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

export default i18n;