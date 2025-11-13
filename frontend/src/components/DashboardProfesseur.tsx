import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    AlertCircle,
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
    Users,
    X,
    XCircle
} from "lucide-react";
import {
    type CandidatureDTO,
    type CreerEvaluationMilieuStageDTO,
    type EntenteStageDTO,
    type EtudiantDTO,
    type EvaluationMilieuStageDTO,
    professeurService,
    type StatutStageDTO
} from "../services/ProfesseurService";
import NavBar from "./NavBar.tsx";
import {useTranslation} from "react-i18next";
import * as React from "react";

const DashboardProfesseur = () => {
    const { t} = useTranslation(["dashboardProfesseur", "evaluationMilieurStage"]);
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [professorName, setProfessorName] = useState("");
    const [downloadingLettre, setDownloadingLettre] = useState<number | null>(null);
    const [, setSelectedStudent] = useState<number | null>(null);
    const [candidatures, setCandidatures] = useState<CandidatureDTO[]>([]);
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [loadingCandidatures, setLoadingCandidatures] = useState(false);
    const [loadingEntentes, setLoadingEntentes] = useState(false);
    const [viewMode, setViewMode] = useState<'candidatures' | 'ententes' | null>(null);
    const [statutsStage, setStatutsStage] = useState<Record<number, StatutStageDTO>>({});
    const token = sessionStorage.getItem("authToken") || "";
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>("");
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState<'students' | 'evaluations'>('students');

    // Evaluation states
    const [evaluations, setEvaluations] = useState<EvaluationMilieuStageDTO[]>([]);
    const [ententesDisponibles, setEntentesDisponibles] = useState<EntenteStageDTO[]>([]);
    const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationMilieuStageDTO | null>(null);
    const [showCreateEvaluationModal, setShowCreateEvaluationModal] = useState(false);
    const [selectedEtudiantForEvaluation, setSelectedEtudiantForEvaluation] = useState<EtudiantDTO | null>(null);
    const [evaluationForm, setEvaluationForm] = useState<CreerEvaluationMilieuStageDTO>({
        ententeId: 0,
        qualiteEncadrement: "",
        pertinenceMissions: "",
        respectHorairesConditions: "",
        communicationDisponibilite: "",
        commentairesAmelioration: ""
    });

    const chargerEtudiants = async () => {
        try {
            setLoading(true);
            const data = await professeurService.getMesEtudiants(token);
            setEtudiants(data);
        } catch (e: any) {
            setError(e.message || t('dashboardProfesseur:error.unknown'));
        } finally {
            setLoading(false);
        }
    };

    const chargerEvaluations = async () => {
        try {
            const evaluationsData = await professeurService.getEvaluationsMilieuStage();
            setEvaluations(evaluationsData);

            // Load all ententes for all students
            const allEntentes: EntenteStageDTO[] = [];
            for (const etudiant of etudiants) {
                if (etudiant.id) {
                    try {
                        const studentEntentes = await professeurService.getEntentesPourEtudiant(etudiant.id, token);
                        // Only include signed ententes that haven't been evaluated yet
                        const signedEntentes = studentEntentes.filter(
                            entente => entente.statut === 'SIGNEE' &&
                                !evaluationsData.some(evaluation => evaluation.ententeId === entente.id)
                        ).map(entente => ({
                            ...entente,
                            etudiantNomComplet: `${etudiant.prenom} ${etudiant.nom}`
                        }));
                        allEntentes.push(...signedEntentes);
                    } catch (e) {
                        console.error(`Failed to load ententes for student ${etudiant.id}`, e);
                    }
                }
            }
            setEntentesDisponibles(allEntentes);
        } catch (e: any) {
            setError(e.message || "Erreur lors du chargement des évaluations");
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "PROFESSEUR") {
            navigate("/login");
            return;
        }

        try {
            const userData = sessionStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                const prenom = user.prenom || '';
                const nom = user.nom || '';
                const fullName = `${prenom} ${nom}`.trim();
                if (fullName) {
                    setProfessorName(fullName);
                }
            }
        } catch (e) {
            console.warn('Unable to parse userData', e);
        }

        if (!token) {
            setError(t('dashboardProfesseur:error.authTokenMissing'));
            return;
        }

        chargerEtudiants().then();
    }, [navigate, token, t]);

    useEffect(() => {
        if (etudiants.length > 0 && activeTab === 'evaluations') {
            chargerEvaluations();
        }
    }, [etudiants, activeTab]);

    const handleViewLettre = async (candidatureId: number) => {
        try {
            setDownloadingLettre(candidatureId);
            const blob = await professeurService.getLettreMotivation(candidatureId, token);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(`Lettre de motivation #${candidatureId}`);
        } catch (error) {
            console.error("Erreur lors du chargement de la lettre:", error);
            alert(t("dashboardProfesseur:error.downloadLetterFailed"));
        } finally {
            setDownloadingLettre(null);
        }
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
            setEntentes(data);

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

    const handleOpenCreateEvaluation = async (etudiant: EtudiantDTO) => {
        setSelectedEtudiantForEvaluation(etudiant);

        // Charger les ententes disponibles pour cet étudiant
        try {
            // Load evaluations to filter out already evaluated ententes
            const evaluationsData = await professeurService.getEvaluationsMilieuStage();

            if (etudiant.id) {
                const studentEntentes = await professeurService.getEntentesPourEtudiant(etudiant.id, token);
                // Only include signed ententes that haven't been evaluated yet
                const signedEntentes = studentEntentes.filter(
                    entente => entente.statut === 'SIGNEE' &&
                        !evaluationsData.some(evaluation => evaluation.ententeId === entente.id)
                ).map(entente => ({
                    ...entente,
                    etudiantNomComplet: `${etudiant.prenom} ${etudiant.nom}`
                }));
                setEntentesDisponibles(signedEntentes);
            }

            // Reset form
            setEvaluationForm({
                ententeId: 0,
                qualiteEncadrement: "",
                pertinenceMissions: "",
                respectHorairesConditions: "",
                communicationDisponibilite: "",
                commentairesAmelioration: ""
            });

            setShowCreateEvaluationModal(true);
        } catch (e: any) {
            setError(e.message || "Erreur lors du chargement des ententes");
        }
    };

    const handleCloseCreateEvaluationModal = () => {
        setShowCreateEvaluationModal(false);
        setSelectedEtudiantForEvaluation(null);
        setEntentesDisponibles([]);
        setEvaluationForm({
            ententeId: 0,
            qualiteEncadrement: "",
            pertinenceMissions: "",
            respectHorairesConditions: "",
            communicationDisponibilite: "",
            commentairesAmelioration: ""
        });
    };

    const closeModal = () => {
        setSelectedStudent(null);
        setViewMode(null);
        setCandidatures([]);
        setEntentes([]);
        setStatutsStage({});
    };

    const handleEvaluationFormChange = (field: keyof CreerEvaluationMilieuStageDTO, value: string | number) => {
        setEvaluationForm(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (evaluationForm.ententeId === 0) {
            setError("Veuillez sélectionner une entente de stage");
            return false;
        }
        if (!evaluationForm.qualiteEncadrement.trim()) {
            setError("Tous les champs sont requis");
            return false;
        }
        if (!evaluationForm.pertinenceMissions.trim()) {
            setError("Tous les champs sont requis");
            return false;
        }
        if (!evaluationForm.respectHorairesConditions.trim()) {
            setError("Tous les champs sont requis");
            return false;
        }
        if (!evaluationForm.communicationDisponibilite.trim()) {
            setError("Tous les champs sont requis");
            return false;
        }
        if (!evaluationForm.commentairesAmelioration.trim()) {
            setError("Tous les champs sont requis");
            return false;
        }
        return true;
    };

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        try {
            setSubmittingEvaluation(true);
            await professeurService.creerEvaluationMilieuStage(evaluationForm);

            alert("Évaluation créée avec succès!");

            // Close modal
            handleCloseCreateEvaluationModal();

            // Reload evaluations
            await chargerEvaluations();

            // Switch to evaluations tab
            setActiveTab('evaluations');

        } catch (error: any) {
            console.error('Erreur lors de la création de l\'évaluation:', error);
            if (error.message.includes("déjà été évaluée") || error.message.includes("already been evaluated")) {
                setError("Cette entente a déjà été évaluée");
            } else if (error.message.includes("non autorisée") || error.message.includes("not authorized")) {
                setError("Vous n'êtes pas autorisé à créer cette évaluation");
            } else if (error.message.includes("signée") || error.message.includes("signed")) {
                setError("L'entente doit être signée par toutes les parties");
            } else {
                setError(error.message || "Erreur lors de la création de l'évaluation");
            }
        } finally {
            setSubmittingEvaluation(false);
        }
    };

    const getStatutBadge = (statut: string) => {
        const styles: Record<string, string> = {
            'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
            'ACCEPTEE': 'bg-green-100 text-green-800',
            'REFUSEE': 'bg-red-100 text-red-800',
            'ENTREVUE': 'bg-blue-100 text-blue-800',
        };
        return styles[statut] || 'bg-gray-100 text-gray-800';
    };

    const getStatutLabel = (statut: string) => {
        return t(`dashboardProfesseur:candidatures.statusBadge.${statut}`, statut);
    };

    const getStatutStageDisplay = (statut: StatutStageDTO) => {
        const config: Record<string, { Icon: any, color: string }> = {
            'PAS_COMMENCE': { Icon: Clock, color: 'text-gray-600' },
            'EN_COURS': { Icon: CheckCircle, color: 'text-blue-600' },
            'TERMINE': { Icon: CheckCircle, color: 'text-green-600' },
        };

        const statusConfig = config[statut] || { Icon: Clock, color: 'text-gray-600' };
        const { Icon, color } = statusConfig;
        const text = t(`dashboardProfesseur:ententes.statutStage.${statut}`, statut);

        return (
            <span className={`flex items-center gap-1 ${color}`}>
                <Icon className="w-4 h-4" />
                {text}
            </span>
        );
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA');
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

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-lg font-medium">Chargement...</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('dashboardProfesseur:title')}
                        {professorName && ` - ${professorName}`}
                    </h1>
                    <p className="text-gray-600">
                        {t('dashboardProfesseur:subtitle')}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-900">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`relative group overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                            activeTab === 'students'
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl scale-105'
                                : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:shadow-lg'
                        }`}
                    >
                        <div className="relative flex flex-col items-center gap-3">
                            <Users className={`w-8 h-8 ${activeTab === 'students' ? 'text-white' : 'text-blue-600'}`} />
                            <div className="text-center">
                                <div className="font-semibold text-lg">Mes Étudiants</div>
                                <div className={`text-sm ${activeTab === 'students' ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {etudiants.length} étudiant{etudiants.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('evaluations')}
                        className={`relative group overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                            activeTab === 'evaluations'
                                ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl scale-105'
                                : 'bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 text-gray-700 hover:shadow-lg'
                        }`}
                    >
                        <div className="relative flex flex-col items-center gap-3">
                            <FileText className={`w-8 h-8 ${activeTab === 'evaluations' ? 'text-white' : 'text-green-600'}`} />
                            <div className="text-center">
                                <div className="font-semibold text-lg">Mes Évaluations</div>
                                <div className={`text-sm ${activeTab === 'evaluations' ? 'text-green-100' : 'text-gray-500'}`}>
                                    {evaluations.length} évaluation{evaluations.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'students' && (
                    <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                {t('dashboardProfesseur:studentList.title')}
                            </h2>
                        </div>

                        {etudiants.length === 0 ? (
                            <div className="p-12 text-center">
                                <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-gray-600">{t('dashboardProfesseur:studentList.noStudents')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            {t('dashboardProfesseur:studentList.student')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            CV
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {etudiants.map((etudiant) => (
                                        <tr key={etudiant.id} className="hover:shadow-sm hover:bg-blue-50/60 transition-all duration-200">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <GraduationCap className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            {etudiant.prenom} {etudiant.nom}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{etudiant.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderCVColumn(etudiant)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => etudiant.id && handleViewCandidatures(etudiant.id)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        <span>Candidatures</span>
                                                    </button>
                                                    <button
                                                        onClick={() => etudiant.id && handleViewEntentes(etudiant.id)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                    >
                                                        <Briefcase className="w-4 h-4" />
                                                        <span>Ententes</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenCreateEvaluation(etudiant)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                                    >
                                                        <ClipboardList className="w-4 h-4" />
                                                        <span>Créer évaluation</span>
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
                )}

                {activeTab === 'evaluations' && (
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Mes Évaluations du Milieu de Stage
                            </h2>
                        </div>

                        {evaluations.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">Aucune évaluation pour le moment</p>
                                <p className="text-gray-400 mt-2">Créez votre première évaluation dans l'onglet "Créer Évaluation"</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Étudiant
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Entreprise
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Date d'évaluation
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
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
                                                            title="Voir les détails"
                                                        >
                                                            <Eye className="w-5 h-5" />
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
                )}
            </div>

            {/* Candidatures Modal */}
            {viewMode === 'candidatures' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-purple-600" />
                                {t('dashboardProfesseur:candidatures.title')}
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
                                <p className="text-center text-gray-600 py-12">{t('dashboardProfesseur:candidatures.noCandidatures')}</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidatures.map((candidature) => (
                                        <div key={candidature.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900">{candidature.offreTitre}</h4>
                                                    <p className="text-sm text-gray-600">{t('dashboardProfesseur:ententes.labels.employer')}: {candidature.employeurNom}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Date: {new Date(candidature.dateCandidature).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadge(candidature.statut)}`}>
                                                    {getStatutLabel(candidature.statut)}
                                                </span>
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
                                                            <span>{t('dashboardProfesseur:candidatures.letterMotivation.view')}</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <FileX className="w-4 h-4" />
                                                            <span className="text-sm">{t('dashboardProfesseur:candidatures.letterMotivation.none')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {candidature.messageReponse && (
                                                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                                    <p className="text-sm text-gray-700"><strong>{t('dashboardProfesseur:candidatures.message')}:</strong> {candidature.messageReponse}</p>
                                                </div>
                                            )}
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
                                {t('dashboardProfesseur:ententes.title')}
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
                            ) : ententes.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">{t('dashboardProfesseur:ententes.noEntentes')}</p>
                            ) : (
                                <div className="space-y-4">
                                    {ententes.map((entente) => {
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
                                                                <p className="text-sm text-gray-500">{t('dashboardProfesseur:ententes.labels.employer')}</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.employeurContact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">{t('dashboardProfesseur:ententes.labels.location')}</p>
                                                                <p className="text-sm font-medium text-gray-900">{entente.lieu}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">{t('dashboardProfesseur:ententes.labels.period')}</p>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {new Date(entente.dateDebut).toLocaleDateString()} - {new Date(entente.dateFin).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">{t('dashboardProfesseur:ententes.labels.weeklyHours')}</p>
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
                                                            ) : entente.etudiantSignature === 'REFUSEE' ? (
                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">
                                                                {t('dashboardProfesseur:ententes.labels.student')}: {t(`dashboardProfesseur:ententes.signatures.${entente.etudiantSignature}`, entente.etudiantSignature)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {entente.employeurSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : entente.employeurSignature === 'REFUSEE' ? (
                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">
                                                                {t('dashboardProfesseur:ententes.labels.employer')}: {t(`dashboardProfesseur:ententes.signatures.${entente.employeurSignature}`, entente.employeurSignature)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {statut && (
                                                        <div className="px-4 py-2 bg-blue-50 rounded-lg">
                                                            <div className="text-sm font-semibold text-gray-700">{t('dashboardProfesseur:ententes.labels.statutStage')}:</div>
                                                            <div className="mt-1">{getStatutStageDisplay(statut)}</div>
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

            {/* Evaluation Details Modal */}
            {selectedEvaluation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">Détails de l'Évaluation</h3>
                            <button
                                onClick={() => setSelectedEvaluation(null)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="bg-green-50 rounded-lg p-4">
                                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    Informations Étudiant
                                </h4>
                                <p className="text-gray-700">
                                    {selectedEvaluation.prenomEtudiant} {selectedEvaluation.nomEtudiant}
                                </p>
                            </div>

                            {/* Company Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Entreprise
                                </h4>
                                <p className="text-gray-700">{selectedEvaluation.nomEntreprise}</p>
                            </div>

                            {/* Evaluation Details */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5" />
                                    Détails de l'Évaluation
                                </h4>

                                <div className="space-y-4">
                                    <div className="border-l-4 border-green-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">Qualité de l'encadrement</p>
                                        <p className="text-gray-600">{selectedEvaluation.qualiteEncadrement}</p>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">Pertinence des missions</p>
                                        <p className="text-gray-600">{selectedEvaluation.pertinenceMissions}</p>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">Respect des horaires et conditions</p>
                                        <p className="text-gray-600">{selectedEvaluation.respectHorairesConditions}</p>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">Communication et disponibilité</p>
                                        <p className="text-gray-600">{selectedEvaluation.communicationDisponibilite}</p>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <p className="font-medium text-gray-700 mb-1">Commentaires et suggestions</p>
                                        <p className="text-gray-600">{selectedEvaluation.commentairesAmelioration}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Date d'évaluation: {formatDate(selectedEvaluation.dateEvaluation)}
                                    </span>
                                    <span>
                                        Évalué par: {selectedEvaluation.prenomProfesseur} {selectedEvaluation.nomProfesseur}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => setSelectedEvaluation(null)}
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Viewer Modal */}
            {pdfUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800">{pdfTitle}</h2>
                            <button
                                onClick={() => {
                                    window.URL.revokeObjectURL(pdfUrl);
                                    setPdfUrl(null);
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

            {/* Modal de création d'évaluation */}
            {showCreateEvaluationModal && selectedEtudiantForEvaluation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6" />
                                    Créer une Évaluation du Milieu de Stage
                                </h3>
                                <p className="text-indigo-100 mt-1">
                                    Étudiant: {selectedEtudiantForEvaluation.prenom} {selectedEtudiantForEvaluation.nom}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseCreateEvaluationModal}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {ententesDisponibles.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg">Aucune entente de stage signée disponible pour évaluation</p>
                                    <p className="text-gray-500 mt-2">L'étudiant doit avoir une entente signée qui n'a pas encore été évaluée</p>
                                    <button
                                        onClick={handleCloseCreateEvaluationModal}
                                        className="mt-6 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitEvaluation} className="space-y-6">
                                    {/* Entente Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Entente de stage *
                                        </label>
                                        <select
                                            value={evaluationForm.ententeId}
                                            onChange={(e) => handleEvaluationFormChange("ententeId", Number(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        >
                                            <option value={0}>Sélectionnez une entente...</option>
                                            {ententesDisponibles.map((entente) => (
                                                <option key={entente.id} value={entente.id}>
                                                    {entente.titre} - {entente.employeurContact} ({new Date(entente.dateDebut).toLocaleDateString()} au {new Date(entente.dateFin).toLocaleDateString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quality of Supervision */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Qualité de l'encadrement *
                                        </label>
                                        <textarea
                                            value={evaluationForm.qualiteEncadrement}
                                            onChange={(e) => handleEvaluationFormChange("qualiteEncadrement", e.target.value)}
                                            placeholder="Décrivez la qualité de l'encadrement fourni par le superviseur de l'entreprise..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Relevance of Missions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pertinence des missions et tâches confiées *
                                        </label>
                                        <textarea
                                            value={evaluationForm.pertinenceMissions}
                                            onChange={(e) => handleEvaluationFormChange("pertinenceMissions", e.target.value)}
                                            placeholder="Évaluez la pertinence des missions confiées à l'étudiant par rapport à son programme d'études..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Respect of Schedules */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Respect des horaires et conditions convenues *
                                        </label>
                                        <textarea
                                            value={evaluationForm.respectHorairesConditions}
                                            onChange={(e) => handleEvaluationFormChange("respectHorairesConditions", e.target.value)}
                                            placeholder="Commentez sur le respect des horaires de travail et des conditions convenues dans l'entente..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Communication */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Communication et disponibilité du superviseur *
                                        </label>
                                        <textarea
                                            value={evaluationForm.communicationDisponibilite}
                                            onChange={(e) => handleEvaluationFormChange("communicationDisponibilite", e.target.value)}
                                            placeholder="Évaluez la communication et la disponibilité du superviseur de l'entreprise..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Comments and Suggestions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Commentaires et suggestions pour amélioration *
                                        </label>
                                        <textarea
                                            value={evaluationForm.commentairesAmelioration}
                                            onChange={(e) => handleEvaluationFormChange("commentairesAmelioration", e.target.value)}
                                            placeholder="Fournissez des commentaires constructifs et des suggestions pour améliorer l'expérience de stage..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex gap-4 pt-4 border-t">
                                        <button
                                            type="submit"
                                            disabled={submittingEvaluation}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {submittingEvaluation ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Soumission en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    Soumettre l'évaluation
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloseCreateEvaluationModal}
                                            disabled={submittingEvaluation}
                                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DashboardProfesseur;
