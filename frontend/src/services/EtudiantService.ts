// Types pour les données d'étudiant
export interface EtudiantData {
    email: string;
    password: string;
    telephone: string;
    prenom: string;
    nom: string;
    progEtude: string;
    session: string;
    annee: string;
}

export interface MessageRetour {
    message: string;
    data: any;
}

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8080';
const ETUDIANT_ENDPOINT = '/OSEetudiant';

class EtudiantService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${ETUDIANT_ENDPOINT}`;
    }

    /**
     * Crée un nouveau compte étudiant
     * @param etudiantData - Les données de l'étudiant à créer
     * @returns Promise avec la réponse du serveur
     */
    async creerCompte(etudiantData: EtudiantData): Promise<MessageRetour> {
        try {
            const response = await fetch(`${this.baseUrl}/creerCompte`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(etudiantData),
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
        prenom: string;
        nom: string;
        email: string;
        telephone: string;
        motDePasse: string;
        confirmerMotDePasse: string;
        programmeEtudes: string;
        anneeEtude: string;
        session: string;
    }): EtudiantData {

        return {
            email: formData.email,
            password: formData.motDePasse,
            telephone: formData.telephone,
            prenom: formData.prenom,
            nom: formData.nom,
            progEtude: formData.programmeEtudes,
            session: formData.session,
            annee: formData.anneeEtude
        };
    }
}

// Export d'une instance unique (Singleton)
export const etudiantService = new EtudiantService();
export default etudiantService;
