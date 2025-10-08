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
    email: string;
    telephone: string;
    nomEntreprise?: string;
    contact: string;
}

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

    // ========== GESTION DES OFFRES ==========
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

            if (data.erreur) {
                console.error('Erreur lors de l\'approbation de l\'offre:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'approbation de l\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de l\'approbation de l\'offre');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors de l\'approbation de l\'offre');
        }
    }

    async refuserOffre(id: number, messageRefus: string, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/refuseOffre`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, messageRefus })
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du refus de l\'offre:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus de l\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors du refus de l\'offre');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors du refus de l\'offre');
        }
    }

    // ========== GESTION DES CVs ==========
    async getAllCVsEnAttente(token: string): Promise<EtudiantDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/CVsEnAttente`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des CVs');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des CVs:', error);
            throw new Error('Erreur lors de la récupération des CVs');
        }
    }

    async approuverCV(id: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/approuveCV`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id })
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors de l\'approbation du CV:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'approbation du CV');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de l\'approbation du CV');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors de l\'approbation du CV');
        }
    }

    async refuserCV(id: number, messageRefusCV: string, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/refuseCV`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, messageRefusCV })
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du refus du CV:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus du CV');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors du refus du CV');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors du refus du CV');
        }
    }
}

export const gestionnaireService = new GestionnaireService();
export default gestionnaireService;