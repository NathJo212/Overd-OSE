export interface EmployeurData {
    email: string;
    password: string;
    telephone: string;
    nomEntreprise: string;
    contact: string;
}

export interface MessageRetour {
    message: string;
    data: any;
}

export interface OffreStageDTO {
    titre: string;
    description: string;
    date_debut: string;
    date_fin: string;
    progEtude: string;
    lieuStage: string;
    remuneration: string;
    dateLimite: string;
    // Optional extended fields supported by backend
    horaire?: string;
    dureeHebdomadaire?: number | string;
    responsabilitesEtudiant?: string;
    responsabilitesEmployeur?: string;
    responsabilitesCollege?: string;
    objectifs?: string;
    utilisateur: { token: string };
}

export interface CandidatureRecueDTO {
    id: number;
    offreId: number;
    offreTitre: string;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantEmail: string;
    dateCandidature: string;
    statut: string;
    acv: boolean;
    alettreMotivation: boolean;
    messageReponse?: string;
    convocationEntrevue?: {
        id: number;
        dateHeure: string;
        lieuOuLien: string;
        message: string;
        statut?: string;
    } | null;
}

export interface ConvocationEntrevueDTO {
    id?: number;
    candidatureId: number;
    dateHeure: string;
    lieuOuLien: string;
    message: string;
    offreTitre?: string;
    employeurNom?: string;
    etudiantNom?: string;
    etudiantPrenom?: string;
    statut: 'CONVOQUEE' | 'MODIFIE' | 'ANNULEE';
}

export interface EntenteStageDTO {
    id: number;
    etudiantId: number;
    etudiantNomComplet: string;
    etudiantEmail: string;
    employeurContact: string;
    employeurEmail: string;
    offreId: number;

    // Champs principaux (peuvent provenir du backend)
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    dateCreation: string;

    // Détails de l'entente
    horaire: string;
    dureeHebdomadaire: number | null;
    remuneration: string;
    responsabilitesEtudiant: string;
    responsabilitesEmployeur: string;
    responsabilitesCollege: string;
    objectifs: string;
    documentPdf: string | null;

    // Signatures
    etudiantSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    employeurSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    gestionnaireSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';

    // Aides UI / état
    lien: string;
    statut: 'EN_ATTENTE' | 'SIGNEE' | 'ANNULEE' | string;
    archived: boolean;

    progEtude: string;
    lieu: string;
}

// ========================================
// TYPES POUR L'ÉVALUATION DES STAGIAIRES
// ========================================

/**
 * Échelle de Likert pour l'évaluation (correspond à NiveauAccordDTO.java)
 */
export type NiveauAccord =
    | 'TOTALEMENT_EN_ACCORD'
    | 'PLUTOT_EN_ACCORD'
    | 'PLUTOT_EN_DESACCORD'
    | 'TOTALEMENT_EN_DESACCORD'
    | 'NON_APPLICABLE';

/**
 * Appréciation globale du stagiaire (correspond à CreerEvaluationDTO.AppreciationGlobale)
 */
export type AppreciationGlobale =
    | 'HABILETES_DEPASSENT_DE_BEAUCOUP_LES_ATTENTES'
    | 'HABILETES_DEPASSENT_LES_ATTENTES'
    | 'HABILETES_REPONDENT_PLEINEMENT_AUX_ATTENTES'
    | 'HABILETES_REPONDENT_PARTIELLEMENT_AUX_ATTENTES'
    | 'HABILETES_NE_REPONDENT_PAS_AUX_ATTENTES';

/**
 * Choix pour accueillir le stagiaire pour un prochain stage (correspond à CreerEvaluationDTO.entrepriseProchainStageChoix)
 */
export type EntrepriseProchainStageChoix =
    | 'OUI'
    | 'NON'
    | 'PEUT_ETRE';

/**
 * Interface pour créer une évaluation (correspond EXACTEMENT à CreerEvaluationDTO.java)
 * IMPORTANT: Tous les champs doivent correspondre exactement aux noms Java en camelCase
 */
export interface CreerEvaluationDTO {
    id?: number;
    ententeId: number;
    etudiantId?: number;

    // Informations du superviseur
    nomSuperviseur: string;
    fonctionSuperviseur: string;
    telephoneSuperviseur: string;
    dateSignature: string; // Format: YYYY-MM-DD (LocalDate en Java)

    // 1. PRODUCTIVITÉ (5 questions + commentaires)
    prodPlanifierOrganiser: NiveauAccord;
    prodComprendreDirectives: NiveauAccord;
    prodRythmeSoutenu: NiveauAccord;
    prodEtablirPriorites: NiveauAccord;
    prodRespectEcheanciers: NiveauAccord;
    commentairesProductivite: string;

    // 2. QUALITÉ DU TRAVAIL (5 questions + commentaires)
    qualRespectMandats: NiveauAccord;
    qualAttentionDetails: NiveauAccord;
    qualVerifierTravail: NiveauAccord;
    qualRechercherPerfectionnement: NiveauAccord;
    qualAnalyseProblemes: NiveauAccord;
    commentairesQualiteTravail: string;

    // 3. QUALITÉS DES RELATIONS INTERPERSONNELLES (6 questions + commentaires)
    relEtablirContacts: NiveauAccord;
    relContribuerEquipe: NiveauAccord;
    relAdapterCulture: NiveauAccord;
    relAccepterCritiques: NiveauAccord;
    relEtreRespectueux: NiveauAccord;
    relEcouteActive: NiveauAccord;
    commentairesRelations: string;

    // 4. HABILETÉS PERSONNELLES (6 questions + commentaires)
    habInteretMotivation: NiveauAccord;
    habExprimerIdees: NiveauAccord;
    habFairePreuveInitiative: NiveauAccord;
    habTravaillerSecuritaire: NiveauAccord;
    habSensResponsabilites: NiveauAccord;
    habPonctuelAssidu: NiveauAccord;
    commentairesHabiletes: string; // ATTENTION: pas d'accent (comme dans le backend Java)

    // APPRÉCIATION GLOBALE ET FINALISATION
    appreciationGlobale: AppreciationGlobale;
    precisionAppreciation: string;
    discussionAvecStagiaire: boolean;
    heuresEncadrementSemaine: number;
    entrepriseAccueillirProchainStage: EntrepriseProchainStageChoix;
    formationTechniqueSuffisante: string; // String (pas boolean) - pour les commentaires
}

/**
 * Interface pour récupérer une évaluation (correspond à EvaluationDTO.java)
 * Le backend retourne uniquement l'id, ententeId, etudiantId, dateEvaluation
 * Le PDF est récupéré séparément via un endpoint dédié
 */
export interface EvaluationDTO {
    id?: number;
    ententeId: number;
    etudiantId?: number;
    employeurId?: number;
    pdfBase64?: string;
    dateEvaluation?: string;
}

// Notification DTO
export interface NotificationDTO {
    id: number;
    messageKey?: string | null;
    messageParam?: string | null;
    lu: boolean;
    dateCreation: string;
}

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8080';
const EMPLOYEUR_ENDPOINT = '/OSEemployeur';

class EmployeurService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${EMPLOYEUR_ENDPOINT}`;
    }

    async creerCompte(employeurData: EmployeurData): Promise<MessageRetour> {
        try {
            const response = await fetch(`${this.baseUrl}/creerCompte`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employeurData),
            });

            const data = await response.json();

            if (data?.erreur) {
                console.error('Erreur lors de la création du compte:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur de création de compte');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    formatFormDataForAPI(formData: {
        nomEntreprise: string;
        adresseEntreprise?: string;
        prenomContact?: string;
        nomContact?: string;
        emailProfessionnel: string;
        telephone: string;
        motDePasse: string;
        confirmerMotDePasse?: string;
    }): EmployeurData {
        return {
            nomEntreprise: formData.nomEntreprise,
            contact: `${formData.prenomContact || ''} ${formData.nomContact || ''}`.trim(),
            email: formData.emailProfessionnel,
            telephone: formData.telephone,
            password: formData.motDePasse,
        };
    }

    async creerOffreDeStage(offre: OffreStageDTO): Promise<MessageRetour> {
        const parsedHeures =
            offre.dureeHebdomadaire === undefined || offre.dureeHebdomadaire === null || offre.dureeHebdomadaire === ""
                ? undefined
                : typeof offre.dureeHebdomadaire === "string"
                    ? parseInt(offre.dureeHebdomadaire, 10)
                    : offre.dureeHebdomadaire;

        const offreDTO: any = {
            authResponseDTO: { token: offre.utilisateur.token },
            titre: offre.titre,
            description: offre.description,
            date_debut: offre.date_debut,
            date_fin: offre.date_fin,
            progEtude: offre.progEtude,
            lieuStage: offre.lieuStage,
            remuneration: offre.remuneration,
            dateLimite: offre.dateLimite,
        };

        // Include optional fields only if provided
        if (offre.horaire) offreDTO.horaire = offre.horaire;
        if (parsedHeures !== undefined && !Number.isNaN(parsedHeures)) offreDTO.dureeHebdomadaire = parsedHeures;
        if (offre.responsabilitesEtudiant) offreDTO.responsabilitesEtudiant = offre.responsabilitesEtudiant;
        if (offre.responsabilitesEmployeur) offreDTO.responsabilitesEmployeur = offre.responsabilitesEmployeur;
        if (offre.responsabilitesCollege) offreDTO.responsabiliteCollege = offre.responsabilitesCollege;
        if (offre.objectifs) offreDTO.objectifs = offre.objectifs;

        try {
            const response = await fetch(`${this.baseUrl}/creerOffre`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${offre.utilisateur.token}`,
                },
                body: JSON.stringify(offreDTO),
            });

            const data = await response.json();

            if (data?.erreur) {
                const error: any = new Error(data.erreur.message || 'Erreur de création d\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;
        } catch (error: any) {
            if (error.response?.data?.erreur) throw error;
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    async getOffresParEmployeur(token: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/OffresParEmployeur`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                const error: any = new Error('Erreur lors de la récupération des offres');
                error.response = { data };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.errorCode) {
                throw error;
            }

            const genericError: any = new Error('Erreur lors de la récupération des offres');
            genericError.response = {
                data: { errorCode: 'ERROR_000' }
            };
            throw genericError;
        }
    }

    async getCandidaturesRecues(): Promise<CandidatureRecueDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des candidatures');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur getCandidaturesRecues:', error);
            throw error;
        }
    }

    async telechargerCvCandidature(id: number): Promise<Blob> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${id}/cv`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du CV');
            }

            return await response.blob();
        } catch (error) {
            console.error('Erreur telechargerCvCandidature:', error);
            throw error;
        }
    }

    async telechargerLettreMotivationCandidature(id: number): Promise<Blob> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${id}/lettre-motivation`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement de la lettre de motivation');
            }

            return await response.blob();
        } catch (error) {
            console.error('Erreur telechargerLettreMotivationCandidature:', error);
            throw error;
        }
    }

    async approuverCandidature(candidatureId: number): Promise<MessageRetour> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/approuver`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data?.erreur) {
                console.error('Erreur lors de l\'approbation de la candidature:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'approbation');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    async refuserCandidature(candidatureId: number, raison: string): Promise<MessageRetour> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/refuser`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ raison })
            });

            const data = await response.json();

            if (data?.erreur) {
                console.error('Erreur lors du refus de la candidature:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    async creerConvocation(candidatureId: number, convocation: { dateHeure: string; lieuOuLien: string; message: string }): Promise<any> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const payload = {
                candidatureId: candidatureId,
                dateHeure: convocation.dateHeure,
                lieuOuLien: convocation.lieuOuLien,
                message: convocation.message
            };

            const response = await fetch(`${this.baseUrl}/creerConvocation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data?.erreur?.message || data?.message || `Erreur HTTP: ${response.status}`;
                const error: any = new Error(message);
                error.response = { data };
                throw error;
            }

            return data;
        } catch (error: any) {
            console.error('Erreur creerConvocation:', error);
            throw error;
        }
    }

    async getConvocations(): Promise<ConvocationEntrevueDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) return [];

            const response = await fetch(`${this.baseUrl}/convocations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) return [];
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const convocations: ConvocationEntrevueDTO[] = await response.json();

            const now = new Date();
            return convocations.filter(conv => {
                const convDate = new Date(conv.dateHeure);
                return convDate > now;
            });
        } catch (error) {
            console.error('Erreur getConvocations:', error);
            return [];
        }
    }

    async modifierConvocation(candidatureId: number, convocation: { dateHeure: string; lieuOuLien: string; message: string }): Promise<any> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const payload = {
                candidatureId: candidatureId,
                dateHeure: convocation.dateHeure,
                lieuOuLien: convocation.lieuOuLien,
                message: convocation.message
            };

            const response = await fetch(`${this.baseUrl}/candidatures/convocation`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data?.erreur?.message || data?.message || `Erreur HTTP: ${response.status}`;
                const error: any = new Error(message);
                error.response = { data };
                throw error;
            }

            return data;
        } catch (error: any) {
            console.error('Erreur modifierConvocation:', error);
            throw error;
        }
    }

    async annulerConvocation(candidatureId: number): Promise<any> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/convocation/annuler`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data?.erreur?.message || data?.message || `Erreur HTTP: ${response.status}`;
                const error: any = new Error(message);
                error.response = { data };
                throw error;
            }

            return data;
        } catch (error: any) {
            console.error('Erreur annulerConvocation:', error);
            throw error;
        }
    }

    async signerEntente(ententeId: number): Promise<MessageRetour> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/signer`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data?.erreur) {
                console.error('Erreur lors de la signature de l\'entente:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de la signature');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    async refuserEntente(ententeId: number): Promise<MessageRetour> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/refuser`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data?.erreur) {
                console.error('Erreur lors du refus de l\'entente:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    async getPdfEntente(ententeId: number): Promise<Blob> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/document`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/pdf')) {
                return await response.blob();
            }

            throw new Error('Contenu PDF non trouvé');
        } catch (error: any) {
            console.error('Erreur getPdfEntente (employeur):', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    async getEntentes(): Promise<EntenteStageDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/ententes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des ententes');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur getEntentes:', error);
            throw error;
        }
    }

    /**
     * Crée une évaluation pour un stagiaire
     * Le backend génère automatiquement un PDF avec toutes les données du formulaire
     * @param evaluationData - Données complètes de l'évaluation (CreerEvaluationDTO)
     * @returns Message de succès ou erreur
     */
    async creerEvaluation(evaluationData: CreerEvaluationDTO): Promise<MessageRetour> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/evaluation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(evaluationData)
            });

            const data = await response.json();

            if (data?.erreur) {
                console.error('Erreur lors de la création de l\'évaluation:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de la création de l\'évaluation');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    /**
     * Récupère toutes les évaluations de l'employeur connecté
     * @returns Liste des évaluations (id, ententeId, etudiantId, dateEvaluation)
     */
    async getEvaluations(): Promise<EvaluationDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/evaluations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des évaluations');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur getEvaluations:', error);
            throw error;
        }
    }

    // --- Notifications ---
    async getNotifications(): Promise<NotificationDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/notifications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

            return await response.json();
        } catch (error: any) {
            throw new Error(error?.message || 'Erreur lors de la récupération des notifications');
        }
    }

    async marquerNotificationLu(id: number, lu: boolean): Promise<void> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/notifications/${id}/lu`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lu)
            });

            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        } catch (error: any) {
            throw new Error(error?.message || 'Erreur lors de la mise à jour de la notification');
        }
    }

    /**
     * Télécharge le PDF d'une évaluation spécifique
     * @param evaluationId - ID de l'évaluation
     * @returns Blob du fichier PDF
     */
    async getPdfEvaluation(evaluationId: number): Promise<Blob> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du PDF d\'évaluation');
            }

            return await response.blob();
        } catch (error) {
            console.error('Erreur telechargerPdfEvaluation:', error);
            throw error;
        }
    }
}

export const employeurService = new EmployeurService();
export default employeurService;

