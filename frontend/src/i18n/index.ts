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
import cvmanagerFr from './locales/fr/cvmanager.json';
import cvmanagerEn from './locales/en/cvmanager.json';
import navbarFr from './locales/fr/navbar.json';
import navbarEn from './locales/en/navbar.json';
import loginFr from './locales/fr/login.json';
import loginEn from './locales/en/login.json';
import offercreateFr from './locales/fr/offercreate.json';
import offercreateEn from './locales/en/offercreate.json';
import employerdashboardFr from './locales/fr/employerdashboard.json';
import employerdashboardEn from './locales/en/employerdashboard.json';
import dashboardEtudiantFr from './locales/fr/dashboardEtudiant.json';
import dashboardEtudiantEn from './locales/en/dashboardEtudiant.json';
import offresStageApprouveFr from './locales/fr/offresStageApprouve.json';
import offresStageApprouveEn from './locales/en/offresStageApprouve.json';
import enProgrammes from './locales/en/programmes.json';
import frProgrammes from './locales/fr/programmes.json';
import televersementCvFr from './locales/fr/televersementCv.json';
import televersementCvEn from './locales/en/televersementCv.json';
import visualiserOffresGestionnaireFr from './locales/fr/visualiserOffresGestionnaire.json';
import visualiserOffresGestionnaireEn from './locales/en/visualiserOffresGestionnaire.json';
import convocationFr from './locales/fr/convocation.json';
import convocationEn from './locales/en/convocation.json';
import candidaturesrecuesEn from './locales/en/candidaturesrecues.json';
import candidaturesrecuesFr from './locales/fr/candidaturesrecues.json';
import candidaturesetudiantEn from './locales/en/candidaturesetudiant.json';
import candidaturesetudiantFr from './locales/fr/candidaturesetudiant.json';

const resources = {
    fr: {
        registration: registrationFr,
        errors: errorsFr,
        home: homeFr,
        internshipmanager: internshipmanagerFr,
        cvmanager: cvmanagerFr,
        navbar: navbarFr,
        offercreate: offercreateFr,
        employerdashboard: employerdashboardFr,
        login: loginFr,
        dashboardEtudiant: dashboardEtudiantFr,
        offresStageApprouve: offresStageApprouveFr,
        programmes: frProgrammes,
        televersementCv: televersementCvFr,
        visualiserOffresGestionnaire : visualiserOffresGestionnaireFr,
        convocation: convocationFr,
        candidaturesrecues: candidaturesrecuesFr,
        candidaturesetudiant: candidaturesetudiantFr,
    },
    en: {
        registration: registrationEn,
        errors: errorsEn,
        home: homeEn,
        internshipmanager: internshipmanagerEn,
        cvmanager: cvmanagerEn,
        navbar: navbarEn,
        offercreate: offercreateEn,
        employerdashboard: employerdashboardEn,
        login: loginEn,
        dashboardEtudiant: dashboardEtudiantEn,
        offresStageApprouve: offresStageApprouveEn,
        programmes: enProgrammes,
        televersementCv: televersementCvEn,
        visualiserOffresGestionnaire : visualiserOffresGestionnaireEn,
        convocation: convocationEn,
        candidaturesrecues: candidaturesrecuesEn,
        candidaturesetudiant: candidaturesetudiantEn,
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