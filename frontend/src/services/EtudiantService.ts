// Types pour les données d'étudiant
export interface EtudiantData {
    email: string;
    password: string;
    telephone: string;
    prenom: string;
    nom: string;
    progEtude: string; // This will be the enum key (e.g., "P420_B0")
    session: string;
    annee: string;
}

export interface MessageRetour {
    message: string;
    data: any;
}

// Programme options matching your backend enum
export interface ProgrammeOption {
    key: string;
    label: string;
}

export const PROGRAMMES: ProgrammeOption[] = [
    { key: "P180_A0", label: "180.A0 Soins infirmiers" },
    { key: "P180_B0", label: "180.B0 Soins infirmiers pour auxiliaires" },
    { key: "P200_B1", label: "200.B1 Sciences de la nature" },
    { key: "P200_Z1", label: "200.Z1 Baccalauréat international en Sciences de la nature Option Sciences de la santé" },
    { key: "P221_A0", label: "221.A0 Technologie de l'architecture" },
    { key: "P221_B0", label: "221.B0 Technologie du génie civil" },
    { key: "P221_D0", label: "221.D0 Technologie de l'estimation et de l'évaluation en bâtiment" },
    { key: "P243_D0", label: "243.D0 Technologie du génie électrique: automatisation et contrôle" },
    { key: "P244_A0", label: "244.A0 Technologie du génie physique" },
    { key: "P300_A1_ADMIN", label: "300.A1 Sciences humaines – profil Administration et économie" },
    { key: "P300_A1_MATH", label: "300.A1 Sciences humaines – profil avec mathématiques" },
    { key: "P300_A1_RELATIONS", label: "300.A1 Sciences humaines – profil Individu et relations humaines" },
    { key: "P300_A1_MONDE", label: "300.A1 Sciences humaines – profil Monde en action" },
    { key: "P322_A1", label: "322.A1 Techniques d'éducation à l'enfance" },
    { key: "P388_A1", label: "388.A1 Techniques de travail social" },
    { key: "P410_A1", label: "410.A1 Gestion des opérations et de la chaîne logistique" },
    { key: "P410_G0", label: "410.G0 Techniques d'administration et de gestion (TAG)" },
    { key: "P420_B0", label: "420.B0 Techniques de l'informatique" },
    { key: "P500_AF", label: "500.AF Photographie et design graphique" },
    { key: "P500_AG", label: "500.AG Cinéma" },
    { key: "P500_AJ", label: "500.AJ Journalisme multimédia" },
    { key: "P500_AL", label: "500.AL Langues – profil Trilinguisme et cultures" }
];

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
                throw new Error(
                    errorData.message ||
                    `Erreur HTTP: ${response.status} - ${response.statusText}`
                );
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
        programmeEtudes: string; // This will be the enum key
        anneeEtude: string;
        session: string;
    }): EtudiantData {

        return {
            email: formData.email,
            password: formData.motDePasse,
            telephone: formData.telephone,
            prenom: formData.prenom,
            nom: formData.nom,
            progEtude: formData.programmeEtudes, // Send the enum key
            session: formData.session,
            annee: formData.anneeEtude
        };
    }

    /**
     * Récupère la liste des programmes disponibles
     * @returns Liste des programmes
     */
    getProgrammes(): ProgrammeOption[] {
        return PROGRAMMES;
    }

    /**
     * Trouve un programme par sa clé
     * @param key - La clé du programme
     * @returns Le programme correspondant ou undefined
     */
    getProgrammeByKey(key: string): ProgrammeOption | undefined {
        return PROGRAMMES.find(p => p.key === key);
    }
}

// Export d'une instance unique (Singleton)
export const etudiantService = new EtudiantService();
export default etudiantService;