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
    const [success, setSuccess] = useState<string>("");
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

    // Options pour enums (cohérents avec EvaluationEnumsDTO.java) - libellés traduits
    const stageNumeroOptions = [
        { value: 'STAGE_1', label: t('options.stageNumero.STAGE_1') },
        { value: 'STAGE_2', label: t('options.stageNumero.STAGE_2') },
    ];

    const niveauAccordOptions = [
        { value: 'TOTALEMENT_EN_ACCORD', label: t('options.niveauAccord.TOTALEMENT_EN_ACCORD') },
        { value: 'PLUTOT_EN_ACCORD', label: t('options.niveauAccord.PLUTOT_EN_ACCORD') },
        { value: 'PLUTOT_DESACCORD', label: t('options.niveauAccord.PLUTOT_DESACCORD') },
        { value: 'TOTALEMENT_DESACCORD', label: t('options.niveauAccord.TOTALEMENT_DESACCORD') },
        { value: 'IMPOSSIBLE_DE_SE_PRONONCER', label: t('options.niveauAccord.IMPOSSIBLE_DE_SE_PRONONCER') },
    ];

    const ouiNonOptions = [
        { value: 'OUI', label: t('options.ouiNon.OUI') },
        { value: 'NON', label: t('options.ouiNon.NON') },
    ];

    const stagiairesNbOptions = [
        { value: 'UN_STAGIAIRE', label: t('options.stagiairesNb.UN_STAGIAIRE') },
        { value: 'DEUX_STAGIAIRES', label: t('options.stagiairesNb.DEUX_STAGIAIRES') },
        { value: 'TROIS_STAGIAIRES', label: t('options.stagiairesNb.TROIS_STAGIAIRES') },
        { value: 'PLUS_DE_TROIS', label: t('options.stagiairesNb.PLUS_DE_TROIS') },
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
            setError(t('errors.selectEntente'));
            return false;
        }
        // Exiger quelques champs clés : stageNumero et au moins un champ d'évaluation sélectionné
        if (!evaluationForm.stageNumero || evaluationForm.stageNumero === '') {
            setError(t('errors.selectStageNumber'));
            return false;
        }
        if (!evaluationForm.tachesConformes || evaluationForm.tachesConformes === '') {
            setError(t('errors.answerEvaluationQuestions'));
            return false;
        }
        // Si une réponse négative a été choisie quelque part, commentaires obligatoires
        if (commentaireRequired) {
            if (!evaluationForm.commentaires || (evaluationForm.commentaires || '').trim() === '') {
                setError(t('errors.commentRequired'));
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

            setError("");
            setSuccess(t("messages.success"));

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
            setPdfTitle(t('pdf.cvTitle', { name: `${etudiant.prenom} ${etudiant.nom}` }));
        } catch (error) {
            console.error("Erreur lors du chargement du CV:", error);
            setError(t('errors.cvDownload'));
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
            const title = evaluation ? t('pdf.evaluationTitle', { name: `${evaluation.prenomEtudiant} ${evaluation.nomEtudiant}` }) : `Évaluation #${evaluationId}`;
            setPdfTitle(title);
        } catch (err) {
            console.error('Erreur téléchargement PDF évaluation', err);
            setError(t('errors.evaluationPdfDownload'));
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
            setError(t('errors.candidaturesLoad'));
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
            setError(t('errors.ententesLoad'));
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
            setPdfTitle(t('pdf.letterTitle', { id: candidatureId }));
        } catch (error) {
            console.error("Erreur lors du chargement de la lettre:", error);
            setError(t('errors.letterDownload'));
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
                    <span className="text-sm">{t("students.noCV")}</span>
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
                <span className="text-sm">{t("actions.viewCV")}</span>
            </button>
        );
    };

    const getProgramName = (programCode: string | undefined) => {
        if (!programCode) return t('misc.na');
        return t(`programmes:${programCode}`, {defaultValue: programCode});
    };

    // entente présélectionnée pour affichage dans le modal
    const selectedEntente = ententesDisponibles.find(e => e.id === evaluationForm.ententeId) || null;

    useEffect(() => {
        if (selectedEntente) {
            setEvaluationForm(prev => ({
                ...prev,
                nomEntreprise: (selectedEntente.nomEntreprise ?? prev.nomEntreprise) || '',
                personneContact: (selectedEntente.employeurContact ?? prev.personneContact) || '',
                nomStagiaire: selectedEtudiant ? `${selectedEtudiant.prenom} ${selectedEtudiant.nom}` : (prev.nomStagiaire || '')
            }));
        }
    }, [selectedEntente, selectedEtudiant]);

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

                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-green-800 font-medium">{success}</p>
                            </div>
                            <button
                                onClick={() => setSuccess("")}
                                className="text-green-400 hover:text-green-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

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
                                {t("header.myStudents")}
                            </h2>
                        </div>

                        {etudiants.length === 0 ? (
                            <div className="p-12 text-center">
                                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">{t("status.noStudents")}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max">
                                    <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[200px]">{t("list.student")}</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">CV</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[180px]">{t("list.actions")}</th>
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
                                                            <span>{t("actions.candidatures")}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => etudiant.id && handleViewEntentes(etudiant.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                                            title="Ententes"
                                                        >
                                                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                                                            <span>{t("actions.ententes")}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openFormForStudent(etudiant)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                                                            title="Évaluer"
                                                        >
                                                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                                            <span>{t("actions.evaluate")}</span>
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
                                                            title={t("list.downloadPdf")}
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
                                {t("candidatures.title")}
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
                                <p className="text-center text-gray-600 py-12">{t("candidatures.noData")}</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidatures.map((candidature) => (
                                        <div key={candidature.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900">{candidature.offreTitre}</h4>
                                                    <p className="text-sm text-gray-600">{t("ententes.employer")}: {candidature.employeurNom}</p>
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
                                                            <span>{t("actions.viewLetter")}</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <FileX className="w-4 h-4" />
                                                            <span className="text-sm">{t("actions.noLetter")}</span>
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
                                {t("actions.ententes")}
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
                                <p className="text-center text-gray-600 py-12">{t("messages.noEntentes")}</p>
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
                                                                <p className="text-sm text-gray-500">{t("ententes.employer")}</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.employeurContact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">{t("ententes.location")}</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.lieu}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">{t("ententes.period")}</p>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {new Date(entente.dateDebut).toLocaleDateString()} - {new Date(entente.dateFin).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">{t("ententes.weeklyHours")}</p>
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
                                                                {t("ententes.employer")}: {entente.etudiantSignature}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {entente.employeurSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">
                                                                {t("ententes.employer")}: {entente.employeurSignature}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {statut && (
                                                        <div className="px-4 py-2 bg-blue-50 rounded-lg">
                                                            <div className="text-sm font-semibold text-gray-700">{t("ententes.statusLabel")}</div>
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

            {/* Evaluation Modal */}
            {viewMode === 'evaluation' && selectedEtudiant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6" />
                                    {t("form.header")}
                                </h3>
                                <p className="text-indigo-100 mt-1 text-sm">{t("form.headerStudent")} {selectedEtudiant.prenom} {selectedEtudiant.nom}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedEtudiant(null); setViewMode(null); setEntentesDisponibles([]); }}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {loadingEntentesDisponibles ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                                </div>
                            ) : ententesDisponibles.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg">{t("messages.noEntentes")}</p>
                                    <p className="text-gray-500 mt-2">{t("messages.ententeNotFinalized")}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Entente sélectionnée */}
                                    <section className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">{t("form.section.entente")}</h4>
                                         {selectedEntente ? (
                                             <div className="flex items-center justify-between gap-4">
                                                 <div className="min-w-0">
                                                     <div className="text-lg font-semibold text-gray-900 truncate">{selectedEntente.titre}</div>
                                                     <div className="text-sm text-indigo-700 font-medium truncate">{selectedEntente.nomEntreprise}</div>
                                                     <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 truncate">
                                                         <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                         <span className="truncate">{selectedEntente.employeurContact}</span>
                                                     </div>
                                                 </div>
                                                 <div className="text-sm text-gray-600 text-right">
                                                     <div>{new Date(selectedEntente.dateDebut).toLocaleDateString()} — {new Date(selectedEntente.dateFin).toLocaleDateString()}</div>
                                                     {selectedEntente.lieu && <div className="mt-1">{selectedEntente.lieu}</div>}
                                                 </div>
                                             </div>
                                         ) : (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">{t("status.noEntente")}</div>
                                         )}
                                     </section>

                                     {/* Entreprise */}
                                     <section className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-indigo-600" /> {t("form.company.title")}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.name")}</label>
                                                <input value={evaluationForm.nomEntreprise || ''} onChange={(e) => handleFormChange('nomEntreprise', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.contact")}</label>
                                                <input value={evaluationForm.personneContact || ''} onChange={(e) => handleFormChange('personneContact', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.address")}</label>
                                                <input value={evaluationForm.adresse || ''} onChange={(e) => handleFormChange('adresse', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.city")}</label>
                                                <input value={evaluationForm.ville || ''} onChange={(e) => handleFormChange('ville', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.postal")}</label>
                                                <input value={evaluationForm.codePostal || ''} onChange={(e) => handleFormChange('codePostal', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.phone")}</label>
                                                <input value={evaluationForm.telephone || ''} onChange={(e) => handleFormChange('telephone', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.company.fax")}</label>
                                                <input value={evaluationForm.telecopieur || ''} onChange={(e) => handleFormChange('telecopieur', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                        </div>
                                    </section>

                                     {/* Stagiaire */}
                                     <section className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600" /> {t("form.section.student")}</h4>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                             <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.student.name")}</label>
                                                <input value={evaluationForm.nomStagiaire || ''} onChange={(e) => handleFormChange('nomStagiaire', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                             </div>
                                             <div>
                                                <label className="block text-sm font-medium text-gray-700">{t("form.student.date")}</label>
                                                <input type="date" value={evaluationForm.dateDuStage || ''} onChange={(e) => handleFormChange('dateDuStage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                             </div>
                                             <div>
                                                {renderRadioGroup('stageNumero', stageNumeroOptions, t("form.student.stageNumberLabel"))}
                                             </div>
                                         </div>
                                     </section>

                                     {/* Évaluation */}
                                     <section className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                         <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-600" /> Évaluation</h4>
                                         <div className="space-y-4">
                                             <div className="grid grid-cols-1 gap-4">
                                                <div>{renderRadioGroup('tachesConformes', niveauAccordOptions, t("form.questions.tachesConformes"))}</div>
                                                <div>{renderRadioGroup('mesuresAccueil', niveauAccordOptions, t("form.questions.mesuresAccueil"))}</div>
                                                    <div>{renderRadioGroup('tempsEncadrementSuffisant', niveauAccordOptions, t("form.questions.tempsEncadrementSuffisant"))}</div>

                                                 <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("form.hours.label")}</label>
                                                     <div className="grid grid-cols-1 gap-2">
                                                         <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                             <div>
                                                                <label className="block text-sm font-medium text-gray-700">{t("form.hours.month1")}</label>
                                                                <input value={evaluationForm.heuresPremierMois || ''} onChange={(e) => handleFormChange('heuresPremierMois', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                                             </div>
                                                             <div>
                                                                <label className="block text-sm font-medium text-gray-700">{t("form.hours.month2")}</label>
                                                                <input value={evaluationForm.heuresDeuxiemeMois || ''} onChange={(e) => handleFormChange('heuresDeuxiemeMois', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                                             </div>
                                                             <div>
                                                                <label className="block text-sm font-medium text-gray-700">{t("form.hours.month3")}</label>
                                                                <input value={evaluationForm.heuresTroisiemeMois || ''} onChange={(e) => handleFormChange('heuresTroisiemeMois', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>

                                        <div>{renderRadioGroup('environnementSecurite', niveauAccordOptions, t("form.questions.environnementSecurite"))}</div>
                                        <div>{renderRadioGroup('climatTravail', niveauAccordOptions, t("form.questions.climatTravail"))}</div>
                                        <div>{renderRadioGroup('milieuAccessible', niveauAccordOptions, t("form.questions.milieuAccessible"))}</div>
                                        <div>{renderRadioGroup('salaireInteressant', niveauAccordOptions, t("form.questions.salaireInteressant"))}</div>

                                         <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t("form.salary.label")}</label>
                                            <input value={evaluationForm.salaireMontantHeure || ''} onChange={(e) => handleFormChange('salaireMontantHeure', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                                         </div>

                                        <div>{renderRadioGroup('communicationSuperviseur', niveauAccordOptions, t("form.questions.communicationSuperviseur"))}</div>
                                        <div>{renderRadioGroup('equipementAdequat', niveauAccordOptions, t("form.questions.equipementAdequat"))}</div>
                                        <div>{renderRadioGroup('volumeTravailAcceptable', niveauAccordOptions, t("form.questions.volumeTravailAcceptable"))}</div>
                                     </div>
                                 </div>
                                 </section>

                                 {/* Commentaires */}
                                 <section className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.comments.label")}
                                        {commentaireRequired && (<span className="text-red-600 ml-2">*</span>)}
                                    </label>
                                    <textarea value={evaluationForm.commentaires || ''} onChange={(e) => handleFormChange('commentaires', e.target.value)} rows={4} className={`w-full px-3 py-2 border rounded-lg ${commentaireRequired && !(evaluationForm.commentaires || '').trim() ? 'border-red-300 bg-red-50' : ''}`} />
                                    {commentaireRequired && (
                                        <p className="text-sm text-red-600 mt-1">{t("form.comments.requiredMsg")}</p>
                                    )}
                                 </section>
                                     {/* Observations & Quarts */}
                                <section className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                    {/* --- Partie haute : observations générales --- */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            {renderRadioGroup('milieuAPrivilegier', stageNumeroOptions, t("form.observations.milieuAPrivilegier"))}
                                        </div>
                                        <div>
                                            {renderRadioGroup('accueillirStagiairesNb', stagiairesNbOptions, t("form.observations.accueillirStagiairesNb"))}
                                        </div>
                                        <div>
                                            {renderRadioGroup('desireAccueillirMemeStagiaire', ouiNonOptions, t("form.observations.desireAccueillirMemeStagiaire"))}
                                        </div>
                                    </div>

                                    {/* --- Offre de quarts variables --- */}
                                    <div className="mb-4">
                                        {renderRadioGroup('offreQuartsVariables', ouiNonOptions, t("form.observations.offreQuartsVariables"))}
                                    </div>

                                    {/* --- Si "OUI" : affichage des quarts A, B, C sur des lignes distinctes --- */}
                                    {evaluationForm.offreQuartsVariables === 'OUI' && (
                                        <div className="space-y-4">
                                            {/* Quart A */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                                <div className="md:col-span-1">
                                                    <label className="block text-sm font-semibold text-gray-800">{t("form.observations.quart.A")}</label>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600">{t("form.observations.quart.from")}</label>
                                                    <input
                                                        type="time"
                                                        value={evaluationForm.quartsADe || ''}
                                                        onChange={(e) => handleFormChange('quartsADe', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600">{t("form.observations.quart.to")}</label>
                                                    <input
                                                        type="time"
                                                        value={evaluationForm.quartsAFin || ''}
                                                        onChange={(e) => handleFormChange('quartsAFin', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                            </div>

                                            {/* Quart B */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                                <div className="md:col-span-1">
                                                    <label className="block text-sm font-semibold text-gray-800">{t("form.observations.quart.B")}</label>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600">{t("form.observations.quart.from")}</label>
                                                    <input
                                                        type="time"
                                                        value={evaluationForm.quartsBDe || ''}
                                                        onChange={(e) => handleFormChange('quartsBDe', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600">{t("form.observations.quart.to")}</label>
                                                    <input
                                                        type="time"
                                                        value={evaluationForm.quartsBFin || ''}
                                                        onChange={(e) => handleFormChange('quartsBFin', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                            </div>

                                            {/* Quart C */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                                <div className="md:col-span-1">
                                                    <label className="block text-sm font-semibold text-gray-800">{t("form.observations.quart.C")}</label>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600">{t("form.observations.quart.from")}</label>
                                                    <input
                                                        type="time"
                                                        value={evaluationForm.quartsCDe || ''}
                                                        onChange={(e) => handleFormChange('quartsCDe', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600">{t("form.observations.quart.to")}</label>
                                                    <input
                                                        type="time"
                                                        value={evaluationForm.quartsCFin || ''}
                                                        onChange={(e) => handleFormChange('quartsCFin', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- Date de signature (toujours visible) --- */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">{t("form.observations.dateSignature")}</label>
                                            <input
                                                type="date"
                                                value={evaluationForm.dateSignature || ''}
                                                onChange={(e) => handleFormChange('dateSignature', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg bg-white border-gray-200 focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </div>
                                    </div>
                                </section>

                                    <div className="flex gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingEvaluation}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
                                >
                                    {submittingEvaluation ? (
                                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> {t("form.submitting")}</span>
                                    ) : (
                                        t("form.submit")
                                    )}
                                </button>
                                <button type="button" onClick={() => { setSelectedEtudiant(null); setViewMode(null); setEntentesDisponibles([]); }} className="px-6 py-3 border rounded-lg">{t("form.cancel")}</button>
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

