const API_URL = 'http://localhost:8080';

export interface AnneeAcademiqueDTO {
    id: number;
    anneeDebut: number;
    anneeFin: number;
    dateDebut: string;
    dateFin: string;
    estCourante: boolean;
    estPassee: boolean;
    estFuture: boolean;
}

export function getLibelleAnnee(annee: AnneeAcademiqueDTO): string {
    return `${annee.anneeDebut}-${annee.anneeFin}`;
}

export const anneeAcademiqueService = {
    /**
     * Récupère l'année académique courante
     */
    async getAnneeCourante(): Promise<AnneeAcademiqueDTO | null> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                console.error('Token d\'authentification manquant');
                return null;
            }

            const response = await fetch(`${API_URL}/OSEAnneeAcademique/courante`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'année courante:', error);
            return null;
        }
    },

    /**
     * Récupère toutes les années académiques
     */
    async getAllAnnees(): Promise<AnneeAcademiqueDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                console.error('Token d\'authentification manquant');
                return [];
            }

            const response = await fetch(`${API_URL}/OSEAnneeAcademique/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return [];
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des années:', error);
            return [];
        }
    },

    /**
     * Récupère les années passées
     */
    async getAnneesPassees(): Promise<AnneeAcademiqueDTO[]> {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                console.error('Token d\'authentification manquant');
                return [];
            }

            const response = await fetch(`${API_URL}/OSEAnneeAcademique/passees`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return [];
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des années passées:', error);
            return [];
        }
    },

    /**
     * Initialise les années académiques (gestionnaire seulement)
     */
    async initialiserAnnees(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/OSEAnneeAcademique/initialiser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des années:', error);
            return false;
        }
    },
};

