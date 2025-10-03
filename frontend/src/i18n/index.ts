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
import internshipmanagerFr from './locales/fr/internshipmanager.json';
import internshipmanagerEn from './locales/en/internshipmanager.json';
import navbarFr from './locales/fr/navbar.json';
import navbarEn from './locales/en/navbar.json';
import loginFr from './locales/fr/login.json';
import loginEn from './locales/en/login.json';


const resources = {
    fr: {
        registration: registrationFr,
        errors: errorsFr,
        home: homeFr,
        internshipmanager:internshipmanagerFr,
        navbar: navbarFr,
        login: loginFr
    },
    en: {
        registration: registrationEn,
        errors: errorsEn,
        home: homeEn,
        internshipmanager:internshipmanagerEn,
        navbar: navbarEn,
        login: loginEn
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