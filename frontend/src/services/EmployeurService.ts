// Types pour les données d'employeur
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
    acv: boolean;  // ✅ tout en minuscule
    alettreMotivation: boolean;  // ✅ tout en minuscule
    messageReponse?: string;
    // optional convocation info (backend may return it)
    convocationEntrevue?: {
        id: number;
        dateHeure: string;
        lieuOuLien: string;
        message: string;
        statut?: string;
    } | null;
}

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8080';
const EMPLOYEUR_ENDPOINT = '/OSEemployeur';

class EmployeurService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${EMPLOYEUR_ENDPOINT}`;
    }

    /**
     * Crée un nouveau compte employeur
     * @param employeurData - Les données de l'employeur à créer
     * @returns Promise avec la réponse du serveur
     */
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

            // ✅ Vérifier si erreur dans MessageRetourDTO
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

    /**
     * Transforme les données du formulaire en format attendu par l'API
     * @param formData - Les données du formulaire d'inscription
     * @returns Les données formatées pour l'API
     */
    formatFormDataForAPI(formData: {
        nomEntreprise: string;
        contact: string;
        email: string;
        telephone: string;
        motDePasse: string;
        confirmerMotDePasse: string;
    }): EmployeurData {
        return {
            nomEntreprise: formData.nomEntreprise,
            contact: formData.contact,
            email: formData.email,
            telephone: formData.telephone,
            password: formData.motDePasse,
        };
    }

    async creerOffreDeStage(offre: OffreStageDTO): Promise<MessageRetour> {
        const offreDTO = {
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

    /**
     * Récupère les candidatures reçues pour les offres de l'employeur
     * @returns Promise avec la liste des candidatures
     */
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

    /**
     * Récupère une candidature spécifique par son ID
     * @param id - L'ID de la candidature
     * @returns Promise avec les détails de la candidature
     */
    async getCandidatureSpecifique(id: number): Promise<CandidatureRecueDTO> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération de la candidature');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur getCandidatureSpecifique:', error);
            throw error;
        }
    }

    /**
     * Télécharge le CV d'une candidature
     * @param id - L'ID de la candidature
     * @returns Promise avec le blob du PDF
     */
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

    /**
     * Télécharge la lettre de motivation d'une candidature
     * @param id - L'ID de la candidature
     * @returns Promise avec le blob du PDF
     */
    async telechargerLettreMotivationCandidature(id: number): Promise<Blob> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            // ✅ ENDPOINT CORRECT avec trait d'union
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

    /**
     * 🆕 NOUVELLE MÉTHODE - Approuve une candidature
     * @param candidatureId - L'ID de la candidature à approuver
     * @returns Promise avec la réponse du serveur
     */
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

            // Vérifier si erreur dans MessageRetourDTO
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

    /**
     * 🆕 NOUVELLE MÉTHODE - Refuse une candidature avec une raison
     * @param candidatureId - L'ID de la candidature à refuser
     * @param raison - La raison du refus
     * @returns Promise avec la réponse du serveur
     */
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

            // Vérifier si erreur dans MessageRetourDTO
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

    /**
     * Crée une convocation d'entrevue
     */
    async creerConvocation(candidatureId: number, convocation: { dateHeure: string; lieuOuLien: string; message: string }): Promise<any> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/convocation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(convocation)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data?.message || `Erreur HTTP: ${response.status}`;
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

    /**
     * Modifie une convocation existante
     */
    async modifierConvocation(convocationId: number, convocation: { dateHeure: string; lieuOuLien: string; message: string }): Promise<any> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/convocations/${convocationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(convocation)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data?.message || `Erreur HTTP: ${response.status}`;
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

    /**
     * Annule (supprime) une convocation
     */
    async annulerConvocation(convocationId: number): Promise<any> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/convocations/${convocationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const message = data?.message || `Erreur HTTP: ${response.status}`;
                const error: any = new Error(message);
                error.response = { data };
                throw error;
            }

            return { message: 'Convocation annulée' };
        } catch (error: any) {
            console.error('Erreur annulerConvocation:', error);
            throw error;
        }
    }
}

// Export d'une instance unique (Singleton)
export const employeurService = new EmployeurService();
export default employeurService;