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
    async telechargerCV(etudiantId: number, token: string): Promise<Blob> {
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
    async telechargerLettreMotivation(candidatureId: number, token: string): Promise<Blob> {
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
}

export const professeurService = new ProfesseurService();
export default professeurService;