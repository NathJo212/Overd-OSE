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
    data?: any;
    errorCode?: string;
}

// Types pour les offres
export interface EmployeurDTO {
    id?: number;
    nomEntreprise: string;
    email: string;
    telephone: string;
}

export interface OffreDTO {
    id: number;
    titre: string;
    description: string;
    date_debut: string;
    date_fin: string;
    progEtude: string;
    lieuStage: string;
    remuneration: string;
    dateLimite: string;
    messageRefus?: string;
    statutApprouve: string;
    employeurDTO: EmployeurDTO;
}

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8080';
const ETUDIANT_ENDPOINT = '/OSEetudiant';

class EtudiantService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${ETUDIANT_ENDPOINT}`;
    }

    async creerCompte(etudiantData: EtudiantData): Promise<MessageRetour> {
        try {
            const response = await fetch(`${this.baseUrl}/creerCompte`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(etudiantData),
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
     * Récupère toutes les offres approuvées
     * @returns Promise avec la liste des offres approuvées
     */
    async getOffresApprouvees(): Promise<OffreDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/voirOffres`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
            }

            return await response.json();

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erreur lors de la récupération des offres: ${error.message}`);
            } else {
                throw new Error('Erreur inconnue lors de la récupération des offres');
            }
        }
    }

    /**
     * Extrait la valeur numérique de la rémunération pour le tri
     * @param remuneration - La chaîne de rémunération
     * @returns La valeur numérique
     */
    extractRemunerationValue(remuneration: string): number {
        const match = remuneration.match(/[\d,]+/);
        if (match) {
            return parseFloat(match[0].replace(',', '.'));
        }
        return 0;
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

export const etudiantService = new EtudiantService();
export default etudiantService;