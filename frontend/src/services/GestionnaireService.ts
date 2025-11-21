const API_BASE_URL = 'http://localhost:8080';
const GESTIONNAIRE_ENDPOINT = '/OSEGestionnaire';

export interface UtilisateurDTO {
    email: string;
    telephone?: string;
    nomEntreprise?: string;
    contact?: string;
    nom?: string;
    prenom?: string;
    progEtude?: string;
    session?: string;
    annee?: string;
}

export interface AuthResponseWrapperDTO {
    token?: string;
    utilisateurDTO?: UtilisateurDTO;
}

export interface EmployeurDTO {
    email: string;
    telephone: string;
    nomEntreprise?: string;
    contact: string;
}

export interface ProfesseurDTO {
    id?: number;
    email: string;
    telephone: string;
    nom: string;
    prenom: string;
    etudiantList?: EtudiantDTO[];
}

export interface EtudiantDTO {
    id?: number;
    email: string;
    telephone: string;
    nom: string;
    prenom: string;
    progEtude?: string;
    session: string;
    annee: string;
    cv?: string;
    statutCV?: string;
    messageRefusCV?: string;
    professeur?: ProfesseurDTO;
}

export interface OffreDTO {
    id: number;
    authResponseDTO?: AuthResponseWrapperDTO;
    titre: string;
    description: string;
    date_debut: string;
    date_fin: string;
    progEtude?: any;
    lieuStage?: string;
    remuneration?: string;
    dateLimite?: string;
    messageRefus?: string;
    statutApprouve: string;
    employeurDTO?: EmployeurDTO;
}

export interface CandidatureEligibleDTO {
    id: number;
    etudiantId: number;
    offreId: number;
    offreTitre: string;
    employeurNom: string;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantEmail: string;
    dateCandidature: string;
    statut: string;
    aCv: boolean;
    aLettreMotivation: boolean;
}

export interface EntenteStageDTO {
    id?: number;
    etudiantId: number;
    offreId: number;

    // Informations complètes de l'entente (retournées par le backend)
    etudiantNomComplet?: string;
    etudiantEmail?: string;
    employeurContact?: string;
    employeurEmail?: string;

    // optional PDF content as base64 (backend may generate later)
    pdfBase64?: string;

    // optional metadata derived from the offer
    titre?: string;
    description?: string;
    dateDebut?: string;
    dateFin?: string;
    horaire?: string;
    dureeHebdomadaire?: number;
    remuneration?: string;
    responsabilitesEtudiant?: string;
    responsabilitesEmployeur?: string;
    responsabilitesCollege?: string;
    objectifs?: string;

    // Informations additionnelles
    progEtude?: string;
    lieu?: string;
    dateCreation?: string;

    // Statuts de signature
    etudiantSignature?: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    employeurSignature?: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    gestionnaireSignature?: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE';
    statut?: 'EN_ATTENTE' | 'SIGNEE' | 'ANNULEE';
    archived?: boolean;
}

// Interface for backend error response
interface ErrorResponse {
    errorCode: string;
    message: string;
}

// Interface for backend MessageRetourDTO
interface MessageRetourDTO {
    message: string | null;
    erreur: ErrorResponse | null;
}

class GestionnaireService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}${GESTIONNAIRE_ENDPOINT}`;
    }

    // ========== GESTION DES OFFRES ==========
    async getAllOffresDeStages(token: string): Promise<OffreDTO[]> {
        const response = await fetch(`${this.baseUrl}/offresEnAttente`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des offres');
        }

        return await response.json();
    }

    async getAllOffres(token: string): Promise<OffreDTO[]> {
        const response = await fetch(`${this.baseUrl}/visualiserOffres`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de toutes les offres');
        }

        return await response.json();
    }

    async approuverOffre(id: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/approuveOffre`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id })
            });

            const data: MessageRetourDTO = await response.json();

            if (data.erreur) {
                console.error('Erreur lors de l\'approbation de l\'offre:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'approbation de l\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de l\'approbation de l\'offre');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors de l\'approbation de l\'offre');
        }
    }

    async refuserOffre(id: number, messageRefus: string, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/refuseOffre`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, messageRefus })
            });

            const data: MessageRetourDTO = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du refus de l\'offre:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus de l\'offre');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors du refus de l\'offre');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors du refus de l\'offre');
        }
    }

    // ========== GESTION DES CVs ==========
    async getAllCVsEnAttente(token: string): Promise<EtudiantDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/CVsEnAttente`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des CVs');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des CVs:', error);
            throw new Error('Erreur lors de la récupération des CVs');
        }
    }

    async approuverCV(id: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/approuveCV`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id })
            });

            const data: MessageRetourDTO = await response.json();

            if (data.erreur) {
                console.error('Erreur lors de l\'approbation du CV:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'approbation du CV');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de l\'approbation du CV');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors de l\'approbation du CV');
        }
    }

    async refuserCV(id: number, messageRefusCV: string, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/refuseCV`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, messageRefusCV })
            });

            const data: MessageRetourDTO = await response.json();

            if (data.erreur) {
                console.error('Erreur lors du refus du CV:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus du CV');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors du refus du CV');
            }

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors du refus du CV');
        }
    }

    async getCandidaturesEligiblesEntente(token: string): Promise<CandidatureEligibleDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/candidaturesEligiblesEntente`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des candidatures éligibles');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des candidatures éligibles:', error);
            throw new Error('Erreur lors de la récupération des candidatures éligibles');
        }
    }

    async creerEntente(ententeData: EntenteStageDTO, token: string): Promise<void> {
        try {
            const payloadWithoutPdf: any = { ...ententeData };
            if (payloadWithoutPdf.pdfBase64) delete payloadWithoutPdf.pdfBase64;

            const doPost = async (bodyPayload: any) => {
                const resp = await fetch(`${this.baseUrl}/ententes`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyPayload)
                });
                const json = await resp.json().catch(() => ({}));
                return { resp, json };
            };

            // First attempt: payload without pdfBase64
            const attempt1 = await doPost(payloadWithoutPdf);
            if (attempt1.resp.ok && !attempt1.json?.erreur) return;

            // If first attempt failed and original ententeData had pdfBase64, try full payload
            if (ententeData.pdfBase64) {
                const attempt2 = await doPost(ententeData);
                if (attempt2.resp.ok && !attempt2.json?.erreur) return;
                // both attempts failed -> throw with the last error info if any
                const errMsg = attempt2.json?.erreur?.message || attempt2.json?.message || `Erreur HTTP: ${attempt2.resp.status}`;
                const error: any = new Error(errMsg);
                error.response = { data: attempt2.json };
                throw error;
            }

            // No pdf to retry with, throw with attempt1 error info
            const errMsg1 = attempt1.json?.erreur?.message || attempt1.json?.message || `Erreur HTTP: ${attempt1.resp.status}`;
            const error1: any = new Error(errMsg1);
            error1.response = { data: attempt1.json };
            throw error1;

        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors de la création de l\'entente');
        }
    }

    // ========== GESTION DES ETUDIANTS ET PROFESSEURS ==========
    async getAllEtudiants(token: string): Promise<EtudiantDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/etudiants`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des étudiants');
            }
            return await response.json();
        } catch (error: any) {
            console.error('Erreur lors de la récupération des étudiants:', error);
            throw new Error('Erreur lors de la récupération des étudiants');
        }
    }

    async getAllProfesseurs(token: string): Promise<ProfesseurDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/professeurs`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des professeurs');
            }
            return await response.json();
        } catch (error: any) {
            console.error('Erreur lors de la récupération des professeurs:', error);
            throw new Error('Erreur lors de la récupération des professeurs');
        }
    }

    async assignEtudiantAProfesseur(etudiantId: number, professeurId: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/etudiant/${etudiantId}/professeur/${professeurId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data: MessageRetourDTO = await response.json();

            // Check for error response
            if (data.erreur) {
                console.error('Erreur lors de l\'assignation:', data.erreur);
                const error: any = new Error(data.erreur.message || 'Erreur lors de l\'assignation de l\'étudiant au professeur');
                error.response = { data };
                throw error;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de l\'assignation de l\'étudiant au professeur');
            }
        } catch (error: any) {
            // If error already has response data, rethrow it
            if (error.response?.data) {
                throw error;
            }
            console.error('Erreur lors de l\'assignation de l\'étudiant:', error);
            throw new Error('Erreur lors de l\'assignation de l\'étudiant au professeur');
        }
    }

    // ========== GESTION DES ENTENTES - SIGNATURE PAR LE GESTIONNAIRE ==========
    /**
     * Récupère toutes les ententes actives (déjà signées)
     * @param token - Token d'authentification
     * @returns Promise avec la liste de toutes les ententes
     */
    async getEntentesFini(token: string): Promise<EntenteStageDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/ententes/fini`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des ententes');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des ententes:', error);
            throw new Error('Erreur lors de la récupération des ententes');
        }
    }

    /**
     * Récupère les ententes prêtes pour la signature du gestionnaire
     * (Où l'étudiant ET l'employeur ont déjà signé)
     * @param token - Token d'authentification
     * @returns Promise avec la liste des ententes prêtes
     */
    async getEntentesPretes(token: string): Promise<EntenteStageDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/ententes/pretes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des ententes prêtes');
            }

            return await response.json();

        } catch (error: any) {
            console.error('Erreur lors de la récupération des ententes prêtes:', error);
            throw new Error('Erreur lors de la récupération des ententes prêtes');
        }
    }

    /**
     * Signe une entente de stage en tant que gestionnaire
     * @param ententeId - identifiant de l'entente
     * @param token - Token d'authentification
     */
    async signerEntente(ententeId: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/signer`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            let data: MessageRetourDTO | null = null;
            const raw = await response.text();
            if (raw) {
                try { data = JSON.parse(raw); } catch { data = null; }
            }

            if (!response.ok) {
                if (data?.erreur) {
                    const error: any = new Error(data.erreur.message || 'Erreur lors de la signature');
                    error.response = { data };
                    throw error;
                }
                const is401 = response.status === 401;
                const fallback: MessageRetourDTO = {
                    message: null,
                    erreur: {
                        errorCode: is401 ? 'AUTHORIZATION_001' : 'ERROR_000',
                        message: is401 ? 'Unauthorized action' : `Erreur HTTP: ${response.status}`
                    }
                };
                const errMsg = fallback.erreur?.message || 'Erreur lors de la signature';
                const error: any = new Error(errMsg);
                error.response = { data: fallback };
                throw error;
            }

            if (data?.erreur) {
                const error: any = new Error(data.erreur.message || 'Erreur lors de la signature');
                error.response = { data };
                throw error;
            }
        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors de la signature de l\'entente');
        }
    }

    /**
     * Refuse une entente de stage en tant que gestionnaire
     * @param ententeId - identifiant de l'entente
     * @param token - Token d'authentification
     */
    async refuserEntente(ententeId: number, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/refuser`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            
            let data: MessageRetourDTO | null = null;
            const raw = await response.text();
            if (raw) {
                try { data = JSON.parse(raw); } catch { data = null; }
            }

            if (!response.ok) {
                if (data?.erreur) {
                    const error: any = new Error(data.erreur.message || 'Erreur lors du refus');
                    error.response = { data };
                    throw error;
                }
                const is401 = response.status === 401;
                const fallback: MessageRetourDTO = {
                    message: null,
                    erreur: {
                        errorCode: is401 ? 'AUTHORIZATION_001' : 'ERROR_000',
                        message: is401 ? 'Unauthorized action' : `Erreur HTTP: ${response.status}`
                    }
                };
                const errMsg = fallback.erreur?.message || 'Erreur lors du refus';
                const error: any = new Error(errMsg);
                error.response = { data: fallback };
                throw error;
            }

            if (data?.erreur) {
                const error: any = new Error(data.erreur.message || 'Erreur lors du refus');
                error.response = { data };
                throw error;
            }
        } catch (error: any) {
            if (error.response?.data) {
                throw error;
            }
            throw new Error('Erreur lors du refus de l\'entente');
        }
    }

    async chatClient(message: string, token: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chatclient`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept-Language': localStorage.getItem('i18nextLng') || 'fr',
            },
            body: JSON.stringify({ message }),
        });
        if (!response.ok) {
            throw new Error(await response.text());
        }
        return await response.text();
    }

    /**
     * Télécharge le PDF d'une entente de stage
     * @param ententeId - L'ID de l'entente dont on veut télécharger le PDF
     * @param token - Token d'authentification
     * @returns Promise avec le Blob du PDF
     */
    async getPdfEntente(ententeId: number, token: string): Promise<Blob> {
        try {
            const response = await fetch(`${this.baseUrl}/ententes/${ententeId}/document`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.blob();
        } catch (error: any) {
            console.error('Erreur getPdfEntente:', error);
            throw new Error('Erreur lors du téléchargement du PDF de l\'entente');
        }
    }
}

export const gestionnaireService = new GestionnaireService();
