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
import ententesFr from './locales/fr/ententesetudiants.json';
import ententesEn from './locales/en/ententesetudiants.json';
import ententesStageGestionnaireFr from './locales/fr/ententeStageGestionnaire.json';
import ententesStageGestionnaireEn from './locales/en/ententeStageGestionnaire.json';
import ententesemployeursEn from './locales/en/ententesemployeurs.json';
import ententesemployeursFr from './locales/fr/ententesemployeurs.json';
import evaluationStagiaireFr from './locales/fr/employeurEvaluationStagiaire.json';
import evaluationStagiaireEn from './locales/en/employeurEvaluationStagiaire.json';
import gestionnaireAttribueEtudiantFr from './locales/fr/gestionnaireAttribueEtudiant.json';
import gestionnaireAttribueEtudiantEn from './locales/en/gestionnaireAttribueEtudiant.json';
import dashboardProfesseurFr from './locales/fr/dashboardProfesseur.json';
import dashboardProfesseurEn from './locales/en/dashboardProfesseur.json';
import gestionnaireSigneEntenteFr from './locales/fr/gestionnaireSigneEntente.json';
import gestionnaireSigneEntenteEn from './locales/en/gestionnaireSigneEntente.json';
import notificationsFr from './locales/fr/notifications.json';
import notificationsEn from './locales/en/notifications.json';
import evaluationMilieurStageEn from './locales/en/evaluationMilieuStage.json';
import evaluationMilieurStageFr from './locales/fr/evaluationMilieuStage.json';

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
        ententesetudiants: ententesFr,
        ententesStageGestionnaire: ententesStageGestionnaireFr,
        ententesemployeurs: ententesemployeursFr,
        gestionnaireAttribueEtudiant: gestionnaireAttribueEtudiantFr,
        evaluationStagiaire: evaluationStagiaireFr,
        dashboardProfesseur: dashboardProfesseurFr,
        notifications: notificationsFr,
        gestionnaireSigneEntente: gestionnaireSigneEntenteFr,
        evaluationMilieurStage: evaluationMilieurStageFr,
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
        ententesetudiants: ententesEn,
        ententesStageGestionnaire: ententesStageGestionnaireEn,
        ententesemployeurs: ententesemployeursEn,
        evaluationStagiaire: evaluationStagiaireEn,
        gestionnaireAttribueEtudiant: gestionnaireAttribueEtudiantEn,
        dashboardProfesseur: dashboardProfesseurEn,
        gestionnaireSigneEntente: gestionnaireSigneEntenteEn,
        notifications: notificationsEn,
        evaluationMilieurStage: evaluationMilieurStageEn,
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
            // Ajout d'un formatter 'candidature' pour formater les notifications de candidature
            format: ((value: any, format?: string, lng?: string) => {
                if (format === 'candidature' || format === 'candidatureAccepted') {
                    const currentLng = typeof lng === 'string' ? lng : (i18n.language || 'fr');
                    const isAccepted = format === 'candidatureAccepted';

                    const buildFr = (nomComplet: string, offre: string) => {
                        if (isAccepted) return `Candidature acceptée par ${nomComplet} pour l'offre ${offre}`.trim();
                        return `Nouvelle candidature de ${nomComplet} pour l'offre ${offre}`.trim();
                    };

                    const buildEn = (nomComplet: string, offre: string) => {
                        if (isAccepted) return `Application accepted by ${nomComplet} for the offer ${offre}`.trim();
                        return `${nomComplet} has applied for the offer ${offre}`.trim();
                    };

                    // Si la valeur est un objet, tenter d'utiliser des champs connus
                    if (typeof value === 'object' && value !== null) {
                        const prenom = (value as any).etudiantPrenom || (value as any).prenom || '';
                        const nom = (value as any).etudiantNom || (value as any).nom || '';
                        const offre = (value as any).offreTitre || (value as any).titre || (value as any).offre || '';
                        const nomComplet = `${prenom} ${nom}`.trim();
                        return currentLng.startsWith('fr') ? buildFr(nomComplet, offre) : buildEn(nomComplet, offre);
                    }

                    // Si la valeur est une chaîne, on essaie de splitter par '||'
                    if (typeof value === 'string') {
                        if (value.includes('||')) {
                            const parts = value.split('||').map((s) => s.trim());
                            const nomComplet = parts[0] || '';
                            const offre = parts[1] || '';
                            return currentLng.startsWith('fr') ? buildFr(nomComplet, offre) : buildEn(nomComplet, offre);
                        }

                        // fallback: juste renvoyer la valeur
                        return value;
                    }
                }

                // fallback par défaut
                return value;
            }) as any
        },

        resources,
    }).then();