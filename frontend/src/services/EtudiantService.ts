export interface EtudiantData {
    email: string;
    password: string;
    telephone: string;
    prenom: string;
    nom: string;
    progEtude: string;
    session: string;
    annee: string;
    cv?: string;
    statutCV?: string;
    messageRefusCV?: string;
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

export interface ConvocationDTO {
    id: number;
    candidatureId: number;
    dateHeure: string;
    lieuOuLien: string;
    message: string;
    offreTitre?: string;
    employeurNom?: string;
    statut?: string;
}

// Interface pour les candidatures de l'étudiant
export interface CandidatureEtudiantDTO {
    id: number;
    offreId: number;
    offreTitre: string;
    employeurNom: string;
    dateCandidature: string;
    statut: string;
    messageReponse?: string;
}

// Interface pour les ententes de stage
export interface EntenteStageDTO {
    id: number;
    // PDF content as base64 (the single source of truth for the entente PDF)
    pdfBase64?: string;

    // Minimal signatures required
    etudiantSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    employeurSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    gestionnaireSignature?: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';

    // Optional metadata from offer or backend (kept for UI compatibility)
    titre?: string;
    dateDebut?: string;
    dateFin?: string;
    dateCreation?: string;
    etudiantId?: number;
    etudiantNomComplet?: string;
    etudiantEmail?: string;
    employeurContact?: string;
    employeurEmail?: string;
    offreId?: number;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    horaire: string;
    dureeHebdomadaire: number | null;
    remuneration: string;
    responsabilites: string;
    objectifs: string;
    documentPdf?: string | null;
    etudiantSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    employeurSignature: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    statut: 'EN_ATTENTE' | 'SIGNEE' | 'ANNULEE' | string;
    archived?: boolean;
    dateCreation: string;

    // Student/employer display info
    etudiantNom?: string;
    etudiantPrenom?: string;
    etudiantEmail?: string;
    employeurNom?: string;

    // Optional helper fields for UI (short and minimal)
    lien?: string;
    statut?: string;
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

            if (data.erreur) {
                console.error('Erreur lors de la création du compte:', data.erreur);

                const error: any = new Error(data.erreur.message || 'Erreur de création de compte');
                error.response = {
                    data: {
                        erreur: data.erreur  // Structure MessageRetourDTO
                    }
                };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);

                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = {
                    data: {
                        erreur: {
                            errorCode: 'ERROR_000',
                            message: error.message
                        }
                    }
                };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    formatFormDataForAPI(formData: {
        prenom: string
        nom: string
        email: string
        telephone: string
        motDePasse: string
        confirmerMotDePasse: string
        programmeEtudes: string
        anneeEtude: string
        session: string
    }): EtudiantData {
        return {
            prenom: formData.prenom,
            nom: formData.nom,
            email: formData.email,
            password: formData.motDePasse,
            telephone: formData.telephone,
            progEtude: formData.programmeEtudes,
            session: formData.session,
            annee: formData.anneeEtude
        };
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
     * Récupère le token JWT depuis le sessionStorage
     * @returns Le token ou null si non trouvé
     */
    private getAuthToken(): string | null {
        return sessionStorage.getItem('authToken');
    }

    async regarderCV(): Promise<string> {
        try {
            const token = this.getAuthToken();
            if (!token) throw new Error("Vous devez être connecté");

            const response = await fetch(`${this.baseUrl}/cv`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Erreur lors du visionnement du CV.");
            }

            const blob = await response.blob();

            if (blob.type !== 'application/pdf') {
                throw new Error("Le fichier reçu n'est pas un PDF.");
            }

            return await this.blobToBase64(blob);

        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Erreur inconnue');
        }
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1]; // Supprimer le préfixe
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du téléversement du CV:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du téléversement du CV');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
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
     * Récupère les informations du CV de l'étudiant connecté
     * @returns Promise avec les informations du CV
     */
    async getInfosCv(): Promise<any> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/cv/info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur getInfosCv:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    /**
     * Postule à une offre avec CV et optionnellement une lettre de motivation
     * @param offreId - L'ID de l'offre
     * @param lettreMotivation - Fichier de la lettre de motivation (optionnel)
     * @returns Promise avec la réponse du serveur
     */
    async postulerOffre(offreId: number, lettreMotivation?: File): Promise<MessageRetour> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour postuler');
            }

            const formData = new FormData();
            formData.append('offreId', offreId.toString());
            if (lettreMotivation) {
                formData.append('lettreMotivation', lettreMotivation);
            }

            const response = await fetch(`${this.baseUrl}/candidatures`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors de la candidature:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de la candidature');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    /**
     * Récupère toutes les candidatures de l'étudiant connecté
     * @returns Promise avec la liste des candidatures
     */
    async getMesCandidatures(): Promise<CandidatureEtudiantDTO[]> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/candidatures`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur getMesCandidatures:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    /**
     * Vérifie si l'étudiant a déjà postulé une offre
     * @param offreId - L'ID de l'offre
     * @returns Promise<boolean> - true si déjà postule, false sinon
     */
    async aPostuleOffre(offreId: number): Promise<boolean> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                return false;
            }

            const response = await fetch(`${this.baseUrl}/offres/${offreId}/a-postule`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.aPostule || false;

        } catch (error) {
            console.error('Erreur lors de la vérification de la candidature:', error);
            return false;
        }
    }

    /**
     * Récupère toutes les convocations de l'étudiant connecté
     * @returns Promise avec la liste des convocations
     */
    async getConvocations(): Promise<ConvocationDTO[]> {
        try {
            const token = this.getAuthToken();
            if (!token) return [];

            // First fetch the student's candidatures
            const candidaturesResp = await fetch(`${this.baseUrl}/candidatures`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!candidaturesResp.ok) {
                // if unauthorized return empty so UI can show notice
                if (candidaturesResp.status === 401) return [];
                throw new Error(`Erreur HTTP candidatures: ${candidaturesResp.status}`);
            }

            const candidatures = await candidaturesResp.json();
            if (!Array.isArray(candidatures) || candidatures.length === 0) return [];

            // For each candidature, attempt to fetch its convocation (may be 404 if none)
            const convocationPromises = candidatures.map(async (cand: any) => {
                try {
                    const resp = await fetch(`${this.baseUrl}/candidatures/${cand.id}/convocation`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!resp.ok) {
                        // if not found or unauthorized, return null to filter out later
                        return null;
                    }

                    const conv: ConvocationDTO = await resp.json();
                    // enrich convocation with related info from candidature if available
                    if (!conv.offreTitre && cand.offreTitre) conv.offreTitre = cand.offreTitre;
                    if (!conv.employeurNom && cand.entrepriseNom) conv.employeurNom = cand.entrepriseNom;
                    return conv;
                } catch (e) {
                    console.error('Erreur lors de la récupération de la convocation pour candidature', cand.id, e);
                    return null;
                }
            });

            const convs = await Promise.all(convocationPromises);
            // filter out nulls and past convocations
            const now = new Date();
            return convs.filter((c): c is ConvocationDTO => {
                if (!c) return false;
                const convDate = new Date(c.dateHeure);
                return convDate > now;
            });
        } catch (error) {
            console.error('Erreur getConvocations:', error);
            return [];
        }
    }

    /**
     * Accepte une offre de stage approuvée par l'employeur
     * @param candidatureId - L'ID de la candidature à accepter
     * @returns Promise avec la réponse du serveur
     */
    async accepterOffreApprouvee(candidatureId: number): Promise<{ message: string }> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour accepter une offre');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/accepter`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors de l\'acceptation:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'acceptation de l\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    /**
     * Refuse une offre de stage approuvée par l'employeur
     * @param candidatureId - L'ID de la candidature à refuser
     * @returns Promise avec la réponse du serveur
     */
    async refuserOffreApprouvee(candidatureId: number): Promise<{ message: string }> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour refuser une offre');
            }

            const response = await fetch(`${this.baseUrl}/candidatures/${candidatureId}/refuser`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du refus:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus de l\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    /**
     * Récupère les ententes de stage en attente de signature de l'étudiant
     * @returns Promise avec la liste des ententes en attente
     */
    async getEntentesEnAttente(): Promise<EntenteStageDTO[]> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/ententes/en-attente`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur getEntentesEnAttente:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    /**
     * Signe une entente de stage
     * @param ententeId - L'ID de l'entente à signer
     * @returns Promise avec la réponse du serveur
     */
    async signerEntente(ententeId: number): Promise<{ message: string }> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour signer une entente');
            }

            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/signer`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors de la signature:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de la signature de l\'entente');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    /**
     * Refuse une entente de stage
     * @param ententeId - L'ID de l'entente à refuser
     * @returns Promise avec la réponse du serveur
     */
    async refuserEntente(ententeId: number): Promise<{ message: string }> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté pour refuser une entente');
            }

            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/refuser`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du refus:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus de l\'entente');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, data);
                const error: any = new Error(`Erreur HTTP: ${response.status}`);
                error.response = { data: { erreur: { errorCode: 'ERROR_000', message: error.message } } };
                throw error;
            }

            return data;

        } catch (error: any) {
            if (error.response?.data?.erreur) {
                throw error;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }

            const genericError: any = new Error(error.message || 'Erreur inconnue');
            genericError.response = {
                data: {
                    erreur: {
                        errorCode: 'ERROR_000',
                        message: error.message
                    }
                }
            };
            throw genericError;
        }
    }

    /**
     * Télécharge le PDF d'une entente de stage
     * @param ententeId - L'ID de l'entente dont on veut télécharger le PDF
     * @returns Promise avec le Blob du PDF
     * Récupère toutes les ententes pour l'étudiant connecté (toutes, pas seulement en attente)
     * @returns Promise avec la liste des ententes
     */
    async telechargerPdfEntente(ententeId: number): Promise<Blob> {
        try {
            const token = this.getAuthToken();
            if (!token) throw new Error('Vous devez être connecté');

            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const contentType = response.headers.get('Content-Type') || '';
            if (!response.ok) {
                // try JSON fallback
                const text = await response.text().catch(() => '');
                try {
                    const json = JSON.parse(text || '{}');
                    if (json?.pdfBase64) {
                        const binary = atob(json.pdfBase64);
                        const len = binary.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                        return new Blob([bytes], { type: 'application/pdf' });
                    }
                } catch (e) {
                    // ignore
                }
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            if (contentType.includes('application/pdf')) {
                return await response.blob();
            }

            const data = await response.json().catch(() => ({}));
            if (data?.pdfBase64) {
                const binary = atob(data.pdfBase64);
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                return new Blob([bytes], { type: 'application/pdf' });
            }

            throw new Error('Contenu PDF non trouvé');
        } catch (error: any) {
            console.error('Erreur telechargerPdfEntente (etudiant):', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    /**
     * Récupère toutes les ententes de stage pour l'étudiant connecté
     * @returns Promise avec la liste des ententes
     */
    async getEntentes(): Promise<EntenteStageDTO[]> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Vous devez être connecté');
            }

            const response = await fetch(`${this.baseUrl}/ententes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur getEntentes (etudiant):', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError: any = new Error('Erreur de connexion au serveur');
                networkError.code = 'ERR_NETWORK';
                throw networkError;
            }
            throw error;
        }
    }

    // Helper to map registration form to API payload
    formatFormDataForAPI(formData: any): EtudiantData {
        return {
            email: formData.email || formData.emailProfessionnel || '',
            password: formData.motDePasse || formData.password || '',
            telephone: formData.telephone || '',
            prenom: formData.prenom || formData.prenomContact || '',
            nom: formData.nom || formData.nomContact || '',
            progEtude: formData.programmeEtudes || formData.progEtude || '',
            session: formData.session || '',
            annee: formData.anneeEtude || formData.annee || '',
        };
    }
}

export const etudiantService = new EtudiantService();
export default etudiantService;