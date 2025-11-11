import * as React from "react";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {
    AlertCircle,
    BookOpen,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    ClipboardList,
    Clock,
    Eye,
    FileText,
    FileX,
    GraduationCap,
    Loader2,
    Mail,
    Phone,
    Users,
    X
} from "lucide-react";
import NavBar from "./NavBar.tsx";
import {
    type CandidatureDTO,
    type CreerEvaluationMilieuStageDTO,
    type EntenteStageDTO,
    type EtudiantDTO,
    type EvaluationMilieuStageDTO,
    professeurService,
    type StatutStageDTO
} from "../services/ProfesseurService";

const DashboardProfesseur = () => {
    const { t } = useTranslation(["dashboardProfesseur"]);
    const navigate = useNavigate();
    const token = sessionStorage.getItem("authToken") || "";

    // States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [evaluations, setEvaluations] = useState<EvaluationMilieuStageDTO[]>([]);
    const [ententesDisponibles, setEntentesDisponibles] = useState<EntenteStageDTO[]>([]);
    const [loadingEntentesDisponibles, setLoadingEntentesDisponibles] = useState(false);
    const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
    const [evaluationForm, setEvaluationForm] = useState<CreerEvaluationMilieuStageDTO>({
        ententeId: 0,
        // entreprise
        nomEntreprise: '', personneContact: '', adresse: '', ville: '', codePostal: '', telephone: '', telecopieur: '',
        // stagiaire
        nomStagiaire: '', dateDuStage: '', stageNumero: '',
        // evaluation enums
        tachesConformes: '', mesuresAccueil: '', tempsEncadrementSuffisant: '',
        environnementSecurite: '', climatTravail: '', milieuAccessible: '', salaireInteressant: '', communicationSuperviseur: '', equipementAdequat: '', volumeTravailAcceptable: '',
        // heures / salaire
        heuresPremierMois: '', heuresDeuxiemeMois: '', heuresTroisiemeMois: '', salaireMontantHeure: '',
        // commentaires / observations
        commentaires: '', milieuAPrivilegier: '', accueillirStagiairesNb: '', desireAccueillirMemeStagiaire: '', offreQuartsVariables: '',
        quartsADe: '', quartsAFin: '', quartsBDe: '', quartsBFin: '', quartsCDe: '', quartsCFin: '', dateSignature: ''
    });
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationMilieuStageDTO | null>(null);
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>("");
    const [viewMode, setViewMode] = useState<'candidatures' | 'ententes' | 'evaluation' | null>(null);
    const [candidatures, setCandidatures] = useState<CandidatureDTO[]>([]);
    const [ententesStudent, setEntentesStudent] = useState<EntenteStageDTO[]>([]);
    const [loadingCandidatures, setLoadingCandidatures] = useState(false);
    const [loadingEntentes, setLoadingEntentes] = useState(false);
    const [statutsStage, setStatutsStage] = useState<Record<number, StatutStageDTO>>({});
    const [downloadingLettre, setDownloadingLettre] = useState<number | null>(null);
    const [selectedEtudiant, setSelectedEtudiant] = useState<EtudiantDTO | null>(null);

    // Options pour enums (cohérents avec EvaluationEnumsDTO.java)
    const stageNumeroOptions = [
        { value: 'STAGE_1', label: 'Stage 1' },
        { value: 'STAGE_2', label: 'Stage 2' },
    ];

    const niveauAccordOptions = [
        { value: 'TOTALEMENT_EN_ACCORD', label: 'Totalement en accord' },
        { value: 'PLUTOT_EN_ACCORD', label: 'Plutôt en accord' },
        { value: 'PLUTOT_DESACCORD', label: 'Plutôt en désaccord' },
        { value: 'TOTALEMENT_DESACCORD', label: 'Totalement en désaccord' },
        { value: 'IMPOSSIBLE_DE_SE_PRONONCER', label: 'Impossible de se prononcer' },
    ];

    const ouiNonOptions = [
        { value: 'OUI', label: 'Oui' },
        { value: 'NON', label: 'Non' },
    ];

    const stagiairesNbOptions = [
        { value: 'UN_STAGIAIRE', label: '1' },
        { value: 'DEUX_STAGIAIRES', label: '2' },
        { value: 'TROIS_STAGIAIRES', label: '3' },
        { value: 'PLUS_DE_TROIS', label: '>3' },
    ];

    // Détermine si le champ 'commentaires' est requis (au moins une réponse négative)
    const commentaireRequired = (() => {
        const negativeValues = ['PLUTOT_DESACCORD', 'TOTALEMENT_DESACCORD'];
        const fieldsToCheck: (keyof CreerEvaluationMilieuStageDTO)[] = [
            'tachesConformes', 'mesuresAccueil', 'tempsEncadrementSuffisant', 'environnementSecurite', 'climatTravail', 'milieuAccessible', 'salaireInteressant', 'communicationSuperviseur', 'equipementAdequat', 'volumeTravailAcceptable'
        ];
        return fieldsToCheck.some(f => negativeValues.includes(((evaluationForm as any)[f] || '') as string));
    })();

    const renderRadioGroup = (field: keyof CreerEvaluationMilieuStageDTO, options: {value:string,label:string}[], label: string) => {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <div className="flex gap-2">
                    {options.map(opt => {
                        const selected = (evaluationForm as any)[field] === opt.value;
                        return (
                            <button
                                type="button"
                                key={opt.value}
                                onClick={() => handleFormChange(field, opt.value)}
                                className={`flex-1 text-center px-4 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Ouvre le formulaire d'évaluation pour un étudiant précis
    const openFormForStudent = async (etudiant: EtudiantDTO) => {
        if (!etudiant || !etudiant.id) return;
        setError("");
        setSelectedEtudiant(etudiant);
        setEvaluationForm(prev => ({ ...prev, ententeId: 0 }));
        setLoadingEntentesDisponibles(true);
        try {
            const data = await professeurService.getEntentesPourEtudiant(etudiant.id, token);
            // garder seulement les ententes signées et qui ne sont pas encore évaluées
            const signed = data.filter((entente: any) =>
                (entente.etudiantSignature === 'SIGNEE' && entente.employeurSignature === 'SIGNEE')
            );
            const available = signed.filter((entente: any) => !evaluations.some((ev: any) => ev.ententeId === entente.id))
                .map((entente: any) => ({ ...entente, etudiantNomComplet: `${etudiant.prenom} ${etudiant.nom}` }));
            setEntentesDisponibles(available);
            // Pré-sélection automatique : si au moins une entente est disponible, la choisir automatiquement
            if (available && available.length > 0) {
                setEvaluationForm(prev => ({ ...prev, ententeId: available[0].id }));
            } else {
                setEvaluationForm(prev => ({ ...prev, ententeId: 0 }));
            }
            setViewMode('evaluation');
        } catch (err: any) {
            console.error('Erreur chargement ententes pour étudiant', etudiant.id, err);
            setError(t('dashboardProfesseur:messages.ententeLoadError') || 'Erreur chargement ententes');
        } finally {
            setLoadingEntentesDisponibles(false);
        }
    };

    // Check authentication
    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "PROFESSEUR") {
            navigate("/login");
            return;
        }

        if (!token) {
            setError(t("messages.unauthorized"));
            return;
        }

        loadData();
    }, [navigate, token, t]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            // Load evaluations, students, and their internship agreements in parallel
            const [evaluationsData, etudiantsData] = await Promise.all([
                professeurService.getEvaluationsMilieuStage(),
                professeurService.getMesEtudiants(token)
            ]);

            setEvaluations(evaluationsData);
            setEtudiants(etudiantsData);

        } catch (e: any) {
            setError(e.message || t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field: keyof CreerEvaluationMilieuStageDTO, value: string | number) => {
        setEvaluationForm(prev => {
            // apply the normal change
            const next = { ...prev, [field]: value } as CreerEvaluationMilieuStageDTO;

            // If the employer indicates there are no variable shifts, clear all quart fields
            if (field === 'offreQuartsVariables') {
                if (String(value) === 'NON') {
                    next.quartsADe = '';
                    next.quartsAFin = '';
                    next.quartsBDe = '';
                    next.quartsBFin = '';
                    next.quartsCDe = '';
                    next.quartsCFin = '';
                }
            }

            return next;
        });
    };

    const validateForm = (): boolean => {
        if (!evaluationForm.ententeId || evaluationForm.ententeId === 0) {
            setError(t("form.selectPlaceholder") || "Veuillez sélectionner une entente");
            return false;
        }
        // Exiger quelques champs clés : stageNumero et au moins un champ d'évaluation sélectionné
        if (!evaluationForm.stageNumero || evaluationForm.stageNumero === '') {
            setError("Veuillez choisir le numéro de stage");
            return false;
        }
        if (!evaluationForm.tachesConformes || evaluationForm.tachesConformes === '') {
            setError("Veuillez répondre aux questions d'évaluation");
            return false;
        }
        // Si une réponse négative a été choisie quelque part, commentaires obligatoires
        if (commentaireRequired) {
            if (!evaluationForm.commentaires || (evaluationForm.commentaires || '').trim() === '') {
                setError("Un commentaire est requis si vous répondez (plutôt en désaccord / totalement en désaccord)");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        try {
            setSubmittingEvaluation(true);
            await professeurService.creerEvaluationMilieuStage(evaluationForm);

            // Reset form and reload data
            setEvaluationForm({
                ententeId: 0,
                nomEntreprise: '', personneContact: '', adresse: '', ville: '', codePostal: '', telephone: '', telecopieur: '',
                nomStagiaire: '', dateDuStage: '', stageNumero: '',
                tachesConformes: '', mesuresAccueil: '', tempsEncadrementSuffisant: '',
                environnementSecurite: '', climatTravail: '', milieuAccessible: '', salaireInteressant: '', communicationSuperviseur: '', equipementAdequat: '', volumeTravailAcceptable: '',
                heuresPremierMois: '', heuresDeuxiemeMois: '', heuresTroisiemeMois: '', salaireMontantHeure: '',
                commentaires: '', milieuAPrivilegier: '', accueillirStagiairesNb: '', desireAccueillirMemeStagiaire: '', offreQuartsVariables: '',
                quartsADe: '', quartsAFin: '', quartsBDe: '', quartsBFin: '', quartsCDe: '', quartsCFin: '', dateSignature: ''
            });
            // fermer le modal d'évaluation et réinitialiser l'étudiant sélectionné
            setSelectedEtudiant(null);
            setViewMode(null);
            setEntentesDisponibles([]);
            await loadData();

            // Show success message briefly
            setError("");
            alert(t("messages.success"));

        } catch (e: any) {
            if (e.message.includes("déjà été évaluée") || e.message.includes("already been evaluated")) {
                setError(t("messages.alreadyEvaluated"));
            } else if (e.message.includes("non autorisée") || e.message.includes("not authorized")) {
                setError(t("messages.unauthorized"));
            } else if (e.message.includes("signée") || e.message.includes("signed")) {
                setError(t("messages.ententeNotFinalized"));
            } else {
                setError(e.message || t("messages.error"));
            }
        } finally {
            setSubmittingEvaluation(false);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA');
    };

    const handleViewCV = async (etudiant: EtudiantDTO) => {
        if (!etudiant.id) return;

        try {
            setDownloadingCV(etudiant.id);
            const blob = await professeurService.getCV(etudiant.id, token);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(`CV de ${etudiant.prenom} ${etudiant.nom}`);
        } catch (error) {
            console.error("Erreur lors du chargement du CV:", error);
            setError("Erreur lors du téléchargement du CV");
        } finally {
            setDownloadingCV(null);
        }
    };

    // Télécharger / ouvrir le PDF d'une évaluation et l'afficher dans le viewer
    const handleViewEvaluationPdf = async (evaluationId: number, evaluation?: EvaluationMilieuStageDTO) => {
        if (!evaluationId) return;
        try {
            const blob = await professeurService.getEvaluationMilieuStagePdf(evaluationId);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            const title = evaluation ? `Évaluation - ${evaluation.prenomEtudiant} ${evaluation.nomEtudiant}` : `Évaluation #${evaluationId}`;
            setPdfTitle(title);
        } catch (err) {
            console.error('Erreur téléchargement PDF évaluation', err);
            setError('Erreur lors du téléchargement du PDF de l\'évaluation');
        }
    };

    const handleViewCandidatures = async (etudiantId: number) => {
        setViewMode('candidatures');
        setLoadingCandidatures(true);
        try {
            const data = await professeurService.getCandidaturesPourEtudiant(etudiantId, token);
            setCandidatures(data);
        } catch (error) {
            console.error('Erreur lors du chargement des candidatures:', error);
            setError("Erreur lors du chargement des candidatures");
        } finally {
            setLoadingCandidatures(false);
        }
    };

    const handleViewEntentes = async (etudiantId: number) => {
        setViewMode('ententes');
        setLoadingEntentes(true);
        try {
            const data = await professeurService.getEntentesPourEtudiant(etudiantId, token);
            setEntentesStudent(data);

            const signedEntentes = data.filter((e: EntenteStageDTO) =>
                e.etudiantSignature === 'SIGNEE' && e.employeurSignature === 'SIGNEE'
            );

            const statuts: Record<number, StatutStageDTO> = {};
            for (const entente of signedEntentes) {
                try {
                    statuts[entente.id] = await professeurService.getStatutStage(entente.id, token);
                } catch (err) {
                    console.error(`Erreur chargement statut entente ${entente.id}:`, err);
                }
            }
            setStatutsStage(statuts);
        } catch (error) {
            console.error('Erreur lors du chargement des ententes:', error);
            setError("Erreur lors du chargement des ententes");
        } finally {
            setLoadingEntentes(false);
        }
    };

    const handleViewLettre = async (candidatureId: number) => {
        try {
            setDownloadingLettre(candidatureId);
            const blob = await professeurService.getLettreMotivation(candidatureId, token);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(`Lettre de motivation #${candidatureId}`);
        } catch (error) {
            console.error("Erreur lors du chargement de la lettre:", error);
            setError("Erreur lors du téléchargement de la lettre de motivation");
        } finally {
            setDownloadingLettre(null);
        }
    };

    const closeModal = () => {
        setViewMode(null);
        setCandidatures([]);
        setEntentesStudent([]);
        setStatutsStage({});
    };

    const renderCVColumn = (etudiant: EtudiantDTO) => {
        if (!etudiant.cv || etudiant.cv.length === 0) {
            return (
                <div className="flex items-center gap-2 text-gray-400">
                    <FileX className="w-4 h-4" />
                    <span className="text-sm">Aucun CV</span>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleViewCV(etudiant)}
                disabled={downloadingCV === etudiant.id}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FileText className="w-4 h-4" />
                <span className="text-sm">Regarder le CV</span>
            </button>
        );
    };

    const getProgramName = (programCode: string | undefined) => {
        if (!programCode) return 'N/A';
        return t(`programmes:${programCode}`, {defaultValue: programCode});
    };

    // entente présélectionnée pour affichage dans le modal
    const selectedEntente = ententesDisponibles.find(e => e.id === evaluationForm.ententeId) || null;

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-lg font-medium">{t("status.loading")}</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-3">
                                    {t("title")}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Students List with CV and Actions */}
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                Mes Étudiants
                            </h2>
                        </div>

                        {etudiants.length === 0 ? (
                            <div className="p-12 text-center">
                                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">Aucun étudiant assigné pour le moment</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max">
                                    <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[200px]">Étudiant</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">CV</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[180px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {etudiants.map((etudiant) => (
                                            <tr key={etudiant.id} className="hover:shadow-sm hover:bg-blue-50/60 transition-all duration-200">
                                                <td className="px-4 py-4 min-w-[240px]">
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar / Icône principale */}
                                                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <GraduationCap className="w-6 h-6 text-blue-600" />
                                                        </div>

                                                        {/* Informations de l'étudiant */}
                                                        <div className="flex flex-col min-w-0">
                                                            {/* Nom complet */}
                                                            <div className="font-semibold text-gray-900 text-sm md:text-base truncate">
                                                                {etudiant.prenom} {etudiant.nom}
                                                            </div>

                                                            {/* Email */}
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                                                                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                                                <span>{etudiant.email}</span>
                                                            </div>

                                                            {/* Téléphone */}
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                                                                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                                                <span>{etudiant.telephone}</span>
                                                            </div>

                                                            {/* Programme */}
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium w-fit">
                                                                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                                                <span className="truncate">{getProgramName(etudiant.progEtude)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 min-w-[120px]">
                                                    {renderCVColumn(etudiant)}
                                                </td>
                                                <td className="px-4 py-4 min-w-[180px]">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => etudiant.id && handleViewCandidatures(etudiant.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
                                                            title="Candidatures"
                                                        >
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span className="hidden xl:inline">Candidatures</span>
                                                        </button>
                                                        <button
                                                            onClick={() => etudiant.id && handleViewEntentes(etudiant.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                                            title="Ententes"
                                                        >
                                                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                                                            <span className="hidden xl:inline">Ententes</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openFormForStudent(etudiant)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                                                            title="Évaluer"
                                                        >
                                                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                                            <span className="hidden xl:inline">Évaluer</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Evaluations List */}
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700">
                            <h2 className="text-2xl font-bold text-white">{t("list.title")}</h2>
                        </div>

                        {evaluations.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">{t("noEvaluations")}</p>
                                <p className="text-gray-400 mt-2">{t("createNew")}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                {t("list.student")}
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                {t("list.company")}
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                {t("list.date")}
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                {t("list.actions")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {evaluations.map((evaluation) => (
                                            <tr key={evaluation.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {evaluation.prenomEtudiant} {evaluation.nomEtudiant}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="w-5 h-5 text-gray-400" />
                                                        <span className="text-gray-900">{evaluation.nomEntreprise}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(evaluation.dateEvaluation)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedEvaluation(evaluation)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title={t("list.view")}
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewEvaluationPdf(evaluation.id, evaluation)}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                            title="Voir PDF"
                                                        >
                                                            <FileText className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Evaluation Details Modal */}
            {selectedEvaluation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">{t("details.title")}</h3>
                            <button
                                onClick={() => setSelectedEvaluation(null)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="bg-indigo-50 rounded-lg p-4">
                                <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    {t("details.studentInfo")}
                                </h4>
                                <p className="text-gray-700">
                                    {selectedEvaluation.prenomEtudiant} {selectedEvaluation.nomEtudiant}
                                </p>
                            </div>

                            {/* Company Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    {t("details.companyInfo")}
                                </h4>
                                <p className="text-gray-700">{selectedEvaluation.nomEntreprise}</p>
                            </div>

                            {/* Evaluation Details */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5" />
                                    {t("details.evaluationInfo")}
                                </h4>

                                <div className="space-y-4">
                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">{t("form.qualiteEncadrement")}</p>
                                        <p className="text-gray-600">{selectedEvaluation.qualiteEncadrement}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">{t("form.pertinenceMissions")}</p>
                                        <p className="text-gray-600">{selectedEvaluation.pertinenceMissions}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">{t("form.respectHoraires")}</p>
                                        <p className="text-gray-600">{selectedEvaluation.respectHorairesConditions}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">{t("form.communication")}</p>
                                        <p className="text-gray-600">{selectedEvaluation.communicationDisponibilite}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">{t("form.commentaires")}</p>
                                        <p className="text-gray-600">{selectedEvaluation.commentairesAmelioration}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t("details.evaluationDate")}: {formatDate(selectedEvaluation.dateEvaluation)}
                                    </span>
                                    <span>
                                        {t("details.evaluatedBy")}: {selectedEvaluation.prenomProfesseur} {selectedEvaluation.nomProfesseur}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => setSelectedEvaluation(null)}
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                                >
                                    {t("details.close")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Candidatures Modal */}
            {viewMode === 'candidatures' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-purple-600" />
                                Candidatures de l'étudiant
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingCandidatures ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />
                                </div>
                            ) : candidatures.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">Aucune candidature trouvée</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidatures.map((candidature) => (
                                        <div key={candidature.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900">{candidature.offreTitre}</h4>
                                                    <p className="text-sm text-gray-600">Employeur: {candidature.employeurNom}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Date: {new Date(candidature.dateCandidature).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                                                <div className="flex items-center gap-2">
                                                    {candidature.alettreMotivation ? (
                                                        <button
                                                            onClick={() => handleViewLettre(candidature.id)}
                                                            disabled={downloadingLettre === candidature.id}
                                                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span>Regarder la lettre de motivation</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <FileX className="w-4 h-4" />
                                                            <span className="text-sm">Aucune lettre de motivation</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Ententes Modal */}
            {viewMode === 'ententes' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-green-600" />
                                Ententes de stage
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingEntentes ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />
                                </div>
                            ) : ententesStudent.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">Aucune entente trouvée</p>
                            ) : (
                                <div className="space-y-4">
                                    {ententesStudent.map((entente) => {
                                        const isSigned = entente.etudiantSignature === 'SIGNEE' && entente.employeurSignature === 'SIGNEE';
                                        const statut = isSigned ? statutsStage[entente.id] : null;

                                        return (
                                            <div key={entente.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-900">{entente.titre}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{entente.description}</p>
                                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-sm text-gray-500">Employeur</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.employeurContact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">Lieu</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.lieu}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">Période</p>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {new Date(entente.dateDebut).toLocaleDateString()} - {new Date(entente.dateFin).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">Durée hebdomadaire</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.dureeHebdomadaire}h</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            {entente.etudiantSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">
                                                                Étudiant: {entente.etudiantSignature}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {entente.employeurSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">
                                                                Employeur: {entente.employeurSignature}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {statut && (
                                                        <div className="px-4 py-2 bg-blue-50 rounded-lg">
                                                            <div className="text-sm font-semibold text-gray-700">Statut du stage:</div>
                                                            <div className="mt-1">{statut}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation Modal (per-student) */}
            {viewMode === 'evaluation' && selectedEtudiant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6" />
                                    Évaluation du Milieu de Stage
                                </h3>
                                <p className="text-indigo-100 mt-1">Étudiant: {selectedEtudiant.prenom} {selectedEtudiant.nom}</p>
                            </div>
                            <button onClick={() => { setSelectedEtudiant(null); setViewMode(null); setEntentesDisponibles([]); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingEntentesDisponibles ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                                </div>
                            ) : ententesDisponibles.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg">Aucune entente de stage signée disponible pour évaluation</p>
                                    <p className="text-gray-500 mt-2">L'étudiant doit avoir une entente signée qui n'a pas encore été évaluée</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Affichage entente présélectionnée */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Entante de stage</label>
                                        {selectedEntente ? (
                                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{selectedEntente.titre}</div>
                                                        <div className="text-sm text-gray-600 mt-1">{selectedEntente.employeurContact}</div>
                                                    </div>
                                                    <div className="text-sm text-gray-600 text-right">
                                                        <div>{new Date(selectedEntente.dateDebut).toLocaleDateString()} — {new Date(selectedEntente.dateFin).toLocaleDateString()}</div>
                                                        {selectedEntente.lieu && <div className="mt-1">{selectedEntente.lieu}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                                                Aucune entente sélectionnée
                                            </div>
                                        )}
                                    </div>

                                    {/* --- IDENTIFICATION DE L'ENTREPRISE (Page 1) --- */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                                            <input value={evaluationForm.nomEntreprise || ''} onChange={(e) => handleFormChange('nomEntreprise', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Personne contact</label>
                                            <input value={evaluationForm.personneContact || ''} onChange={(e) => handleFormChange('personneContact', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Adresse</label>
                                            <input value={evaluationForm.adresse || ''} onChange={(e) => handleFormChange('adresse', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ville</label>
                                            <input value={evaluationForm.ville || ''} onChange={(e) => handleFormChange('ville', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Code postal</label>
                                            <input value={evaluationForm.codePostal || ''} onChange={(e) => handleFormChange('codePostal', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                            <input value={evaluationForm.telephone || ''} onChange={(e) => handleFormChange('telephone', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Télécopieur</label>
                                            <input value={evaluationForm.telecopieur || ''} onChange={(e) => handleFormChange('telecopieur', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                    </div>

                                    {/* --- IDENTIFICATION DU STAGIAIRE (Page 1) --- */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nom du stagiaire</label>
                                            <input value={evaluationForm.nomStagiaire || ''} onChange={(e) => handleFormChange('nomStagiaire', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date du stage</label>
                                            <input type="date" value={evaluationForm.dateDuStage || ''} onChange={(e) => handleFormChange('dateDuStage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Numéro de stage (choix)</label>
                                            {renderRadioGroup('stageNumero', stageNumeroOptions, 'Numéro de stage')}
                                        </div>
                                    </div>

                                    {/* --- ÉVALUATION (Page 1 & 2) --- */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                {renderRadioGroup('tachesConformes', niveauAccordOptions, 'Tâches conformes')}
                                            </div>
                                            <div>
                                                {renderRadioGroup('mesuresAccueil', niveauAccordOptions, "Mesures d'accueil")}
                                            </div>
                                            <div>
                                                {renderRadioGroup('tempsEncadrementSuffisant', niveauAccordOptions, "Temps encadrement suffisant")}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Heures par mois</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <input value={evaluationForm.heuresPremierMois || ''} onChange={(e) => handleFormChange('heuresPremierMois', e.target.value)} placeholder="1er mois" className="w-full px-3 py-2 border rounded-lg" />
                                                    <input value={evaluationForm.heuresDeuxiemeMois || ''} onChange={(e) => handleFormChange('heuresDeuxiemeMois', e.target.value)} placeholder="2e mois" className="w-full px-3 py-2 border rounded-lg" />
                                                    <input value={evaluationForm.heuresTroisiemeMois || ''} onChange={(e) => handleFormChange('heuresTroisiemeMois', e.target.value)} placeholder="3e mois" className="w-full px-3 py-2 border rounded-lg" />
                                                </div>
                                            </div>
                                            <div>
                                                {renderRadioGroup('environnementSecurite', niveauAccordOptions, 'Environnement & sécurité')}
                                            </div>
                                            <div>
                                                {renderRadioGroup('climatTravail', niveauAccordOptions, 'Climat de travail')}
                                            </div>
                                            <div>
                                                {renderRadioGroup('milieuAccessible', niveauAccordOptions, 'Milieu accessible')}
                                            </div>
                                            <div>
                                                {renderRadioGroup('salaireInteressant', niveauAccordOptions, 'Salaire intéressant')}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Montant salaire / heure</label>
                                                <input value={evaluationForm.salaireMontantHeure || ''} onChange={(e) => handleFormChange('salaireMontantHeure', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                {renderRadioGroup('communicationSuperviseur', niveauAccordOptions, 'Communication du superviseur')}
                                            </div>
                                            <div>
                                                {renderRadioGroup('equipementAdequat', niveauAccordOptions, 'Équipement adéquat')}
                                            </div>
                                            <div>
                                                {renderRadioGroup('volumeTravailAcceptable', niveauAccordOptions, 'Volume de travail acceptable')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- COMMENTAIRES (Page 2) --- */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Commentaires
                                            {commentaireRequired && (<span className="text-red-600 ml-2">*</span>)}
                                        </label>
                                        <textarea value={evaluationForm.commentaires || ''} onChange={(e) => handleFormChange('commentaires', e.target.value)} rows={4} className={`w-full px-3 py-2 border rounded-lg ${commentaireRequired && !(evaluationForm.commentaires || '').trim() ? 'border-red-300 bg-red-50' : ''}`} />
                                        {commentaireRequired && (
                                            <p className="text-sm text-red-600 mt-1">Un commentaire est requis si vous avez répondu "Plutôt en désaccord" ou "Totalement en désaccord" à une question.</p>
                                        )}
                                    </div>

                                    {/* --- OBSERVATIONS GÉNÉRALES (Page 2) --- */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Milieu à privilégier</label>
                                            {renderRadioGroup('milieuAPrivilegier', stageNumeroOptions, 'Milieu à privilégier')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nombre de stagiaires à accueillir</label>
                                            {renderRadioGroup('accueillirStagiairesNb', stagiairesNbOptions, 'Nombre de stagiaires')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Désire accueillir même stagiaire ?</label>
                                            {renderRadioGroup('desireAccueillirMemeStagiaire', ouiNonOptions, 'Accueillir même stagiaire')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Offre quarts variables ?</label>
                                            {renderRadioGroup('offreQuartsVariables', ouiNonOptions, 'Quarts variables')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarts A (de)</label>
                                            <input value={evaluationForm.quartsADe || ''} onChange={(e) => handleFormChange('quartsADe', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarts A (à)</label>
                                            <input value={evaluationForm.quartsAFin || ''} onChange={(e) => handleFormChange('quartsAFin', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarts B (de)</label>
                                            <input value={evaluationForm.quartsBDe || ''} onChange={(e) => handleFormChange('quartsBDe', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarts B (à)</label>
                                            <input value={evaluationForm.quartsBFin || ''} onChange={(e) => handleFormChange('quartsBFin', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarts C (de)</label>
                                            <input value={evaluationForm.quartsCDe || ''} onChange={(e) => handleFormChange('quartsCDe', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarts C (à)</label>
                                            <input value={evaluationForm.quartsCFin || ''} onChange={(e) => handleFormChange('quartsCFin', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date de signature</label>
                                            <input type="date" value={evaluationForm.dateSignature || ''} onChange={(e) => handleFormChange('dateSignature', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={submittingEvaluation}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
                                        >
                                            {submittingEvaluation ? (
                                                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Soumission...</span>
                                            ) : (
                                                'Créer l\'évaluation'
                                            )}
                                        </button>
                                        <button type="button" onClick={() => { setSelectedEtudiant(null); setViewMode(null); setEntentesDisponibles([]); }} className="px-6 py-2 border rounded-lg">Annuler</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Viewer Modal (pour CV / lettre) */}
            {pdfUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800">{pdfTitle}</h2>
                            <button
                                onClick={() => {
                                    window.URL.revokeObjectURL(pdfUrl);
                                    setPdfUrl(null);
                                    setPdfTitle("");
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>
                        <iframe
                            src={pdfUrl}
                            title={pdfTitle}
                            className="flex-1 w-full"
                            style={{ border: "none" }}
                        />
                    </div>
                </div>
            )}

        </>
    );
};

export default DashboardProfesseur;

