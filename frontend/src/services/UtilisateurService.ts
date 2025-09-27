export interface LoginData {
    email: string;
    password: string;
}

// Interface pour la réponse d'authentification basée sur votre API
export interface AuthResponseDTO {
    token: string;
    utilisateurDTO: {
        email: string;
        password: string;
        telephone: string;
        nomEntreprise?: string; // Pour les employeurs
        contact?: string; // Pour les employeurs
        nom?: string; // Pour les étudiants
        prenom?: string; // Pour les étudiants
        progEtude?: string; // Pour les étudiants
        session?: string; // Pour les étudiants
        annee?: number; // Pour les étudiants
    };
}

// Configuration de l'API
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

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur lors de la connexion:', errorData);
            }

            const authResponse: AuthResponseDTO = await response.json();

            // Stocker le token et les informations utilisateur dans le sessionStorage
            this.stockerDonneesUtilisateur(authResponse);

            return authResponse;

        } catch (error) {
            // Gestion des erreurs de réseau ou autres
            if (error instanceof Error) {
                throw error; // Re-lancer l'erreur telle quelle si c'est déjà une Error
            } else {
                throw new Error('Erreur inconnue lors de la connexion');
            }
        }
    }

    /**
     * Stocke les données d'authentification dans le sessionStorage
     * @param authResponse - La réponse d'authentification
     */
    private stockerDonneesUtilisateur(authResponse: AuthResponseDTO): void {
        // Stocker le token
        sessionStorage.setItem('authToken', authResponse.token);

        // Extraire le userType du token JWT
        let userType: string | null = null;

        try {
            // Décoder le payload du JWT pour extraire les authorities
            const payload = JSON.parse(atob(authResponse.token.split('.')[1]));
            console.log('Payload du JWT:', payload);

            // Extraire le rôle des authorities
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

        // Stocker les données utilisateur (structure utilisateurDTO)
        if (authResponse.utilisateurDTO) {
            // Créer un objet utilisateur nettoyé (sans le mot de passe)
            const { password, ...userDataSafe } = authResponse.utilisateurDTO;
            sessionStorage.setItem('userData', JSON.stringify(userDataSafe));
        }
    }


    /**
     * Formate les données du formulaire pour l'API
     * @param formData
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

    async deconnexion(): Promise<void> {
        try {
            let token = sessionStorage.getItem('authToken')
            const response = await fetch(`${this.baseUrl}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(token),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur lors de la déconnexion:', errorData);
            }

            sessionStorage.clear();
        } catch (error) {
            // Gestion des erreurs de réseau ou autres
            if (error instanceof Error) {
                throw error; // Re-lancer l'erreur telle quelle si c'est déjà une Error
            } else {
                throw new Error('Erreur inconnue lors de la déconnexion');
            }
        }

    }
}

// Export d'une instance unique (Singleton)
export const utilisateurService = new UtilisateurService();
export default utilisateurService;