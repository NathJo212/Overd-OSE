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
        const response = await fetch(`${this.baseUrl}/approuveOffre`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });
        if (!response.ok) {
            const txt = await response.text();
            throw new Error(txt || 'Erreur lors de l\'approbation');
        }
    }

    async refuserOffre(id: number, raison: string, token: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/refuseOffre`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, messageRefus: raison })
        });
        if (!response.ok) {
            const txt = await response.text();
            throw new Error(txt || 'Erreur lors du refus');
        }
    }
}

export const gestionnaireService = new GestionnaireService();
