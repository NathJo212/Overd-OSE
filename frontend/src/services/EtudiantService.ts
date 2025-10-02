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
                const errorData = await response.json().catch(() => ({}));
                console.log(new Error(
                    errorData.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                ));
            }

            return await response.json();

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erreur lors de la création du compte: ${error.message}`);
            } else {
                throw new Error('Erreur inconnue lors de la création du compte');
            }
        }
    }

    /**
     * Récupère le token JWT depuis le sessionStorage
     * @returns Le token ou null si non trouvé
     */
    private getAuthToken(): string | null {
        return sessionStorage.getItem('authToken');
    }

    /**
     * Téléverse un CV pour l'étudiant connecté
     * @param fichierCv - Le fichier PDF du CV
     * @returns Promise avec la réponse du serveur
     */
    async uploadCv(fichierCv: File): Promise<MessageRetour> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour téléverser un CV');
            }

            const formData = new FormData();
            formData.append('cv', fichierCv);

            const response = await fetch(`${this.baseUrl}/cv`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.data ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
            }

            return await response.json();

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erreur lors du téléversement du CV: ${error.message}`);
            } else {
                throw new Error('Erreur inconnue lors du téléversement du CV');
            }
        }
    }

    /**
     * Télécharge le CV de l'étudiant connecté
     * @returns Promise qui déclenche le téléchargement du fichier
     */
    async telechargerCv(): Promise<void> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour télécharger votre CV');
            }

            const response = await fetch(`${this.baseUrl}/cv`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Aucun CV trouvé ou erreur lors de la récupération');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cv.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erreur lors du téléchargement du CV: ${error.message}`);
            } else {
                throw new Error('Erreur inconnue lors du téléchargement du CV');
            }
        }
    }

    /**
     * Vérifie si l'étudiant connecté a un CV
     * @returns Promise<boolean> - true si un CV existe, false sinon
     */
    async verifierCvExiste(): Promise<boolean> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                return false;
            }

            const response = await fetch(`${this.baseUrl}/cv`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            return response.ok;

        } catch (error) {
            console.error('Erreur lors de la vérification du CV:', error);
            return false;
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

export const etudiantService = new EtudiantService();
export default etudiantService;