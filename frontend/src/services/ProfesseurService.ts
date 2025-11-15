const API_BASE_URL = 'http://localhost:8080';
const PROFESSEUR_ENDPOINT = '/OSEProfesseur';

export interface EtudiantDTO {
    id?: number;
    email: string;
    telephone: string;
    nom: string;
    prenom: string;
    progEtude?: string;
    session: string;
    annee: string;
    cv?: any;
    statutCV?: string;
    messageRefusCV?: string;
}

export interface CandidatureDTO {
    id: number;
    offreId: number;
    offreTitre: string;
    employeurNom: string;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantEmail: string;
    dateCandidature: string;
    statut: string;
    aCv: boolean;
    alettreMotivation: boolean;
    messageReponse?: string;
    convocation?: ConvocationEntrevueDTO;
}

export interface ConvocationEntrevueDTO {
    candidatureId: number;
    dateHeure: string;
    lieuOuLien: string;
    message: string;
    statut: string;
}

export interface EntenteStageDTO {
    id: number;
    etudiantId: number;
    etudiantNomComplet: string;
    etudiantEmail: string;
    nomEntreprise: string;
    employeurContact: string;
    employeurEmail: string;
    offreId?: number;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    horaire: string;
    dureeHebdomadaire: number;
    remuneration: string;
    responsabilites: string;
    objectifs: string;
    progEtude: string;
    lieu: string;
    documentPdf?: any;
    etudiantSignature: string;
    employeurSignature: string;
    statut: string;
    archived: boolean;
    dateCreation: string;
}

export type StatutStageDTO = 'PAS_COMMENCE' | 'EN_COURS' | 'TERMINE';

export interface EvaluationMilieuStageDTO {
    id: number;
    ententeId: number;
    professeurId: number;
    employeurId: number;
    etudiantId: number;
    nomProfesseur: string;
    prenomProfesseur: string;
    nomEntreprise: string;
    nomEtudiant: string;
    prenomEtudiant: string;
    qualiteEncadrement: string;
    pertinenceMissions: string;
    respectHorairesConditions: string;
    communicationDisponibilite: string;
    commentairesAmelioration: string;
    pdfBase64?: string;
    dateEvaluation: string;
}

export interface CreerEvaluationMilieuStageDTO {
    ententeId?: number;
    employeurId?: number;
    // Champs ajoutés pour la création d'une évaluation (correspondent à EvaluationMilieuStageDTO)
    qualiteEncadrement?: string;
    pertinenceMissions?: string;
    respectHorairesConditions?: string;
    communicationDisponibilite?: string;
    commentairesAmelioration?: string;

    // --- IDENTIFICATION DE L'ENTREPRISE (Page 1)
    nomEntreprise?: string;
    personneContact?: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
    telephone?: string;
    telecopieur?: string;

    // --- IDENTIFICATION DU STAGIAIRE (Page 1)
    nomStagiaire?: string;
    dateDuStage?: string; // ISO date
    stageNumero?: string; // enum represented as string

    // --- ÉVALUATION (Page 1 & 2)
    tachesConformes?: string;
    mesuresAccueil?: string;
    tempsEncadrementSuffisant?: string;
    heuresPremierMois?: string;
    heuresDeuxiemeMois?: string;
    heuresTroisiemeMois?: string;
    environnementSecurite?: string;
    climatTravail?: string;
    milieuAccessible?: string;
    salaireInteressant?: string;
    salaireMontantHeure?: string;
    communicationSuperviseur?: string;
    equipementAdequat?: string;
    volumeTravailAcceptable?: string;

    // --- COMMENTAIRES (Zone de texte Page 2)
    commentaires?: string;

    // --- OBSERVATIONS GÉNÉRALES (Page 2)
    milieuAPrivilegier?: string;
    accueillirStagiairesNb?: string;
    desireAccueillirMemeStagiaire?: string;
    offreQuartsVariables?: string;
    quartsADe?: string;
    quartsAFin?: string;
    quartsBDe?: string;
    quartsBFin?: string;
    quartsCDe?: string;
    quartsCFin?: string;
    dateSignature?: string; // ISO date
}

class ProfesseurService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${PROFESSEUR_ENDPOINT}`;
    }

    getToken(): string | null {
        return sessionStorage.getItem('authToken');
    }

    /**
     * Récupère tous les étudiants assignés au professeur authentifié
     * @param token - Le token d'authentification
     * @returns Promise avec la liste des étudiants
     */
    async getMesEtudiants(token: string): Promise<EtudiantDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/etudiants`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Action non autorisée');
                }
                if (response.status === 404) {
                    throw new Error('Professeur non trouvé');
                }
                throw new Error('Erreur lors de la récupération des étudiants');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des étudiants:', error);
            throw error;
        }
    }

    /**
     * Télécharge le CV d'un étudiant
     * @param etudiantId - L'ID de l'étudiant
     * @param token - Le token d'authentification
     * @returns Promise avec le Blob du CV
     */
    async getCV(etudiantId: number, token: string): Promise<Blob> {
        try {
            const response = await fetch(`${this.baseUrl}/etudiants/${etudiantId}/cv`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du CV');
            }

            return await response.blob();

        } catch (error: any) {
            console.error('Erreur lors du téléchargement du CV:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les candidatures d'un étudiant
     * @param etudiantId - L'ID de l'étudiant
     * @param token - Le token d'authentification
     * @returns Promise avec la liste des candidatures
     */
    async getCandidaturesPourEtudiant(etudiantId: number, token: string): Promise<CandidatureDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/etudiants/${etudiantId}/candidatures`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Étudiant non trouvé');
                }
                throw new Error('Erreur lors de la récupération des candidatures');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des candidatures:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les ententes de stage d'un étudiant
     * @param etudiantId - L'ID de l'étudiant
     * @param token - Le token d'authentification
     * @returns Promise avec la liste des ententes
     */
    async getEntentesPourEtudiant(etudiantId: number, token: string): Promise<EntenteStageDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/etudiants/${etudiantId}/ententes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Étudiant non trouvé');
                }
                throw new Error('Erreur lors de la récupération des ententes');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des ententes:', error);
            throw error;
        }
    }

    /**
     * Télécharge la lettre de motivation pour une candidature
     * @param candidatureId - L'ID de la candidature
     * @param token - Le token d'authentification
     * @returns Promise avec le Blob de la lettre
     */
    async getLettreMotivation(candidatureId: number, token: string): Promise<Blob> {
        try {
            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/lettre`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Lettre de motivation non trouvée');
                }
                throw new Error('Erreur lors du téléchargement de la lettre');
            }

            return await response.blob();

        } catch (error: any) {
            console.error('Erreur lors du téléchargement de la lettre:', error);
            throw error;
        }
    }

    /**
     * Récupère le statut du stage pour une entente
     * @param ententeId - L'ID de l'entente
     * @param token - Le token d'authentification
     * @returns Promise avec le statut du stage
     */
    async getStatutStage(ententeId: number, token: string): Promise<StatutStageDTO> {
        try {
            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/statut`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Entente non trouvée');
                }
                throw new Error('Erreur lors de la récupération du statut');
            }

            const data = await response.json();
            console.log('Raw statut response:', data);

            // If backend returns string directly
            if (typeof data === 'string') {
                return data as StatutStageDTO;
            }

            // If backend returns object with code/label
            if (data && typeof data === 'object' && 'code' in data) {
                return data.code as StatutStageDTO;
            }

            return data;

        } catch (error: any) {
            console.error('Erreur lors de la récupération du statut:', error);
            throw error;
        }
    }

    /**
     * Crée une évaluation du milieu de stage
     * @param data - Les données de l'évaluation
     * @returns Promise void
     */
    async creerEvaluationMilieuStage(data: CreerEvaluationMilieuStageDTO): Promise<void> {
        try {
            const token = this.getToken();
            const response = await fetch(`${this.baseUrl}/evaluation-milieu-stage`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error) {
                    throw new Error(errorData.error.message || 'Erreur lors de la création de l\'évaluation');
                }
                throw new Error('Erreur lors de la création de l\'évaluation');
            }
        } catch (error: any) {
            console.error('Erreur lors de la création de l\'évaluation:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les évaluations du milieu de stage du professeur
     * @returns Promise avec la liste des évaluations
     */
    async getEvaluationsMilieuStage(): Promise<EvaluationMilieuStageDTO[]> {
        try {
            const token = this.getToken();
            const response = await fetch(`${this.baseUrl}/evaluations-milieu-stage`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des évaluations');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Erreur lors de la récupération des évaluations:', error);
            throw error;
        }
    }

    /**
     * Récupère une évaluation spécifique
     * @param evaluationId - L'ID de l'évaluation
     * @returns Promise avec l'évaluation
     */
    async getEvaluationMilieuStage(evaluationId: number): Promise<EvaluationMilieuStageDTO> {
        try {
            const token = this.getToken();
            const response = await fetch(`${this.baseUrl}/evaluations-milieu-stage/${evaluationId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération de l\'évaluation');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Erreur lors de la récupération de l\'évaluation:', error);
            throw error;
        }
    }

    /**
     * Télécharge le PDF d'une évaluation
     * @param evaluationId - L'ID de l'évaluation
     * @returns Promise avec le Blob du PDF
     */
    async getEvaluationMilieuStagePdf(evaluationId: number): Promise<Blob> {
        try {
            const token = this.getToken();
            const response = await fetch(`${this.baseUrl}/evaluations-milieu-stage/${evaluationId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du PDF');
            }

            return await response.blob();
        } catch (error: any) {
            console.error('Erreur lors du téléchargement du PDF:', error);
            throw error;
        }
    }
}

export const professeurService = new ProfesseurService();
export default professeurService;
