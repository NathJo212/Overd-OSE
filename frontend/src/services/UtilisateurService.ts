export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponseDTO {
    token: string;
    utilisateurDTO: {
        email: string;
        password: string;
        telephone: string;
        nomEntreprise?: string;
        contact?: string;
        nom?: string;
        prenom?: string;
        progEtude?: string;
        session?: string;
        annee?: number;
    };
}

export interface ErrorResponse {
    errorCode: string;
    message?: string;
}

const API_BASE_URL = 'http://localhost:8080';
const UTILISATEUR_ENDPOINT = '/OSE';

class UtilisateurService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${UTILISATEUR_ENDPOINT}`;
    }

    /**
     * Authentifie un utilisateur avec email et mot de passe
     * @param loginData - Les données de connexion (email, password)
     * @returns Promise avec la réponse d'authentification
     */
    async authentifier(loginData: LoginData): Promise<AuthResponseDTO> {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            // ✅ Lire la réponse UNE SEULE FOIS
            const data = await response.json();

            if (!response.ok) {
                console.error('Erreur lors de la connexion:', data);

                // Si le backend envoie un ErrorResponse avec errorCode
                if (data.errorCode) {
                    const error: any = new Error(data.message || 'Erreur de connexion');
                    error.response = { data }; // Attacher errorCode pour Login.tsx
                    throw error;
                }

                // Sinon, erreur classique (rétrocompatibilité)
                const error: any = new Error(
                    data.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
                error.response = {
                    data: { errorCode: 'ERROR_000', message: error.message }
                };
                throw error;
            }

            const authResponse: AuthResponseDTO = data;

            // Stocker le token et les informations utilisateur
            this.stockerDonneesUtilisateur(authResponse);

            return authResponse;

        } catch (error: any) {
            // Si l'erreur a déjà un errorCode, la relancer
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
                error.message || 'Erreur inconnue lors de la connexion'
            );
            genericError.response = {
                data: { errorCode: 'ERROR_000', message: error.message }
            };
            throw genericError;
        }
    }

    /**
     * Récupère tous les programmes disponibles
     * @returns Promise avec un tableau de clés de programmes
     */
    async getAllProgrammes(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/getProgrammes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.errorCode) {
                throw error;
            }

            const genericError: any = new Error('Erreur lors de la récupération des programmes');
            genericError.response = {
                data: { errorCode: 'ERROR_000' }
            };
            throw genericError;
        }
    }

    /**
     * Stocke les données d'authentification dans le sessionStorage
     */
    private stockerDonneesUtilisateur(authResponse: AuthResponseDTO): void {
        sessionStorage.setItem('authToken', authResponse.token);

        let userType: string | null = null;

        try {
            const payload = JSON.parse(atob(authResponse.token.split('.')[1]));
            console.log('Payload du JWT:', payload);

            if (payload.authorities && Array.isArray(payload.authorities)) {
                const authority = payload.authorities[0];
                userType = authority.authority || authority;
            }
        } catch (e) {
            console.warn('Impossible de décoder le JWT:', e);
        }

        if (userType) {
            sessionStorage.setItem('userType', userType);
        }

        if (authResponse.utilisateurDTO) {
            const { password, ...userDataSafe } = authResponse.utilisateurDTO;
            sessionStorage.setItem('userData', JSON.stringify(userDataSafe));
        }
    }

    /**
     * Formate les données du formulaire pour l'API
     */
    formatLoginDataForAPI(formData: {
        email: string;
        password: string;
    }): LoginData {
        return {
            email: formData.email.trim(),
            password: formData.password
        };
    }

    /**
     * Déconnexion de l'utilisateur
     */
    async deconnexion(): Promise<void> {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch(`${this.baseUrl}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Si errorCode présent
                if (data.errorCode) {
                    const error: any = new Error(data.message || 'Erreur de déconnexion');
                    error.response = { data };
                    throw error;
                }

                const error: any = new Error(data.message || `Erreur HTTP: ${response.status}`);
                error.response = {
                    data: { errorCode: 'ERROR_000' }
                };
                throw error;
            }

            sessionStorage.clear();

        } catch (error: any) {
            if (error.response?.data?.errorCode) {
                throw error;
            }

            const genericError: any = new Error('Erreur lors de la déconnexion');
            genericError.response = {
                data: { errorCode: 'ERROR_000' }
            };
            throw genericError;
        }
    }
}

export const utilisateurService = new UtilisateurService();
export default utilisateurService;