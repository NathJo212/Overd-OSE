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

            if (!response.ok) {
                // Gestion des erreurs HTTP
                const errorData = await response.json().catch(() => ({}));
                console.log(new Error(
                    errorData.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                ));
            }

            return await response.json();

        } catch (error) {
            // Gestion des erreurs de réseau ou autres
            if (error instanceof Error) {
                throw new Error(`Erreur lors de la création du compte: ${error.message}`);
            } else {
                throw new Error('Erreur inconnue lors de la création du compte');
            }
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
        // Construction du DTO attendu par le backend
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erreur lors de la création de l'offre: ${error.message}`);
            } else {
                throw new Error('Erreur inconnue lors de la création de l\'offre');
            }
        }
    }
}

// Export d'une instance unique (Singleton)
export const employeurService = new EmployeurService();
export default employeurService;