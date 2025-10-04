const API_BASE_URL = 'http://localhost:8080';
const GESTIONNAIRE_ENDPOINT = '/OSEGestionnaire';

export interface UtilisateurDTO {
    email: string;
    telephone?: string;
    nomEntreprise?: string;
    contact?: string;
    nom?: string;
    prenom?: string;
    progEtude?: string;
    session?: string;
    annee?: string;
}

export interface AuthResponseWrapperDTO {
    token?: string;
    utilisateurDTO?: UtilisateurDTO;
}

export interface EmployeurDTO {
    email: String;
    telephone: String;
    nomEntreprise?: string;
    contact: string;
}

export interface OffreDTO {
    id: number;
    authResponseDTO?: AuthResponseWrapperDTO;
    titre: string;
    description: string;
    date_debut: string;
    date_fin: string;
    progEtude?: string;
    lieuStage?: string;
    remuneration?: string;
    dateLimite?: string;
    messageRefus?: string;
    employeurDTO?: EmployeurDTO;
}

class GestionnaireService {
    private readonly baseUrl: string;
    constructor() {
        this.baseUrl = `${API_BASE_URL}${GESTIONNAIRE_ENDPOINT}`;
    }

    async getAllOffresDeStages(token: string): Promise<OffreDTO[]> {
        const response = await fetch(`${this.baseUrl}/offresEnAttente`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des offres');
        return await response.json();
    }

    async approuverOffre(id: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/approuveOffre`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id })
            });

            const data = await response.json();

            // ✅ Vérifier si erreur dans MessageRetourDTO
            if (data.erreur) {
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'approbation');
                error.response = { data: { erreur: data.erreur } };
                throw error;
            }

            if (!response.ok) {
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = {
                    data: { erreur: { errorCode: 'ERROR_000', message: error.message } }
                };
                throw error;
            }
        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }
            throw new Error('Erreur lors de l\'approbation');
        }
    }

    async refuserOffre(id: number, raison: string, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/refuseOffre`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, messageRefus: raison })
            });

            const data = await response.json();

            // ✅ Vérifier si erreur dans MessageRetourDTO
            if (data.erreur) {
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus');
                error.response = { data: { erreur: data.erreur } };
                throw error;
            }

            if (!response.ok) {
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = {
                    data: { erreur: { errorCode: 'ERROR_000', message: error.message } }
                };
                throw error;
            }
        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }
            throw new Error('Erreur lors du refus');
        }
    }
}

export const gestionnaireService = new GestionnaireService();
