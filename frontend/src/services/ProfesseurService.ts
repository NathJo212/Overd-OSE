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
    cv?: string;
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
}

export const professeurService = new ProfesseurService();
export default professeurService;