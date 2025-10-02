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

            if (!response.ok) {
                if (data.errorCode) {
                    const error: any = new Error(data.message || 'Erreur lors de la création du compte');
                    error.response = { data }; // Attacher errorCode pour le composant
                    throw error;
                }

                // Sinon, erreur avec message classique (rétrocompatibilité)
                const error: any = new Error(
                    data.erreur ||
                    data.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
                error.response = {
                    data: { errorCode: 'ERROR_000', message: error.message }
                };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.errorCode) {
                throw error;
            }

            // Gestion des erreurs de réseau
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.response = {
                    data: { errorCode: 'NETWORK_ERROR' }
                };
                throw networkError;
            }

            const genericError: any = new Error(
                error.message || 'Erreur inconnue lors de la création du compte'
            );

            genericError.response = {
                data: { errorCode: 'ERROR_000', message: error.message }
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
        emailProfessionnel: string;
        motDePasse: string;
        telephone: string;
        nomEntreprise: string;
        prenomContact: string;
        nomContact: string;
    }): EmployeurData {
        return {
            email: formData.emailProfessionnel,
            password: formData.motDePasse,
            telephone: formData.telephone,
            nomEntreprise: formData.nomEntreprise,
            contact: `${formData.prenomContact} ${formData.nomContact}`.trim()
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

            // Lire la réponse UNE SEULE FOIS
            const data = await response.json();

            if (!response.ok) {
                // Si le backend envoie un ErrorResponse avec errorCode
                if (data.errorCode) {
                    const error: any = new Error(data.message || 'Erreur lors de la création de l\'offre');
                    error.response = { data };
                    throw error;
                }

                // Sinon, erreur classique
                const error: any = new Error(
                    data.erreur ||
                    data.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
                error.response = {
                    data: { errorCode: 'ERROR_000', message: error.message }
                };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.errorCode) {
                throw error;
            }

            // Gestion des erreurs de réseau
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.response = {
                    data: { errorCode: 'NETWORK_ERROR' }
                };
                throw networkError;
            }

            // Autres erreurs
            const genericError: any = new Error(
                error.message || 'Erreur inconnue lors de la création de l\'offre'
            );
            genericError.response = {
                data: { errorCode: 'ERROR_000', message: error.message }
            };
            throw genericError;
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
}

// Export d'une instance unique (Singleton)
export const employeurService = new EmployeurService();
export default employeurService;