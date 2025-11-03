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
    cv?: string; // This will be base64 encoded or null
    statutCV?: string;
    messageRefusCV?: string;
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
}

export const professeurService = new ProfesseurService();
export default professeurService;