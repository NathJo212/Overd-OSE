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
