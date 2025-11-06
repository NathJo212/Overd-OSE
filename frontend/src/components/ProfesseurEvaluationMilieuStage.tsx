import * as React from "react";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {
    AlertCircle,
    ArrowLeft,
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

const ProfesseurEvaluationMilieuStage = () => {
    const { t } = useTranslation(["evaluationMilieurStage"]);
    const navigate = useNavigate();
    const token = sessionStorage.getItem("authToken") || "";

    // States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [evaluations, setEvaluations] = useState<EvaluationMilieuStageDTO[]>([]);
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationMilieuStageDTO | null>(null);
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>("");
    const [viewMode, setViewMode] = useState<'candidatures' | 'ententes' | null>(null);
    const [candidatures, setCandidatures] = useState<CandidatureDTO[]>([]);
    const [ententesStudent, setEntentesStudent] = useState<EntenteStageDTO[]>([]);
    const [loadingCandidatures, setLoadingCandidatures] = useState(false);
    const [loadingEntentes, setLoadingEntentes] = useState(false);
    const [statutsStage, setStatutsStage] = useState<Record<number, StatutStageDTO>>({});
    const [downloadingLettre, setDownloadingLettre] = useState<number | null>(null);

    // Form data
    const [formData, setFormData] = useState<CreerEvaluationMilieuStageDTO>({
        ententeId: 0,
        qualiteEncadrement: "",
        pertinenceMissions: "",
        respectHorairesConditions: "",
        communicationDisponibilite: "",
        commentairesAmelioration: ""
    });

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

            // Load all ententes for all students
            const allEntentes: EntenteStageDTO[] = [];
            for (const etudiant of etudiantsData) {
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
            setEntentes(allEntentes);

        } catch (e: any) {
            setError(e.message || t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field: keyof CreerEvaluationMilieuStageDTO, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (formData.ententeId === 0) {
            setError(t("form.selectPlaceholder"));
            return false;
        }
        if (!formData.qualiteEncadrement.trim()) {
            setError(t("form.required"));
            return false;
        }
        if (!formData.pertinenceMissions.trim()) {
            setError(t("form.required"));
            return false;
        }
        if (!formData.respectHorairesConditions.trim()) {
            setError(t("form.required"));
            return false;
        }
        if (!formData.communicationDisponibilite.trim()) {
            setError(t("form.required"));
            return false;
        }
        if (!formData.commentairesAmelioration.trim()) {
            setError(t("form.required"));
            return false;
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
            setSubmitting(true);
            await professeurService.creerEvaluationMilieuStage(formData);

            // Reset form and reload data
            setFormData({
                ententeId: 0,
                qualiteEncadrement: "",
                pertinenceMissions: "",
                respectHorairesConditions: "",
                communicationDisponibilite: "",
                commentairesAmelioration: ""
            });
            setShowForm(false);
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
            setSubmitting(false);
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
        return programCode;
    };

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
                            <button
                                onClick={() => navigate("/dashboard-professeur")}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-indigo-700" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-3">
                                    <ClipboardList className="w-8 h-8" />
                                    {t("title")}
                                </h1>
                                <p className="text-indigo-600 mt-1">{t("myEvaluations")}</p>
                            </div>
                        </div>

                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg"
                            >
                                <FileText className="w-5 h-5" />
                                {t("createEvaluation")}
                            </button>
                        )}
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

                    {/* Form */}
                    {showForm && (
                        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-indigo-900">{t("form.title")}</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Entente Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.selectEntente")} *
                                    </label>
                                    {ententes.length === 0 ? (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                                            {t("messages.noEntentes")}
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.ententeId}
                                            onChange={(e) => handleFormChange("ententeId", Number(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        >
                                            <option value={0}>{t("form.selectPlaceholder")}</option>
                                            {ententes.map((entente) => (
                                                <option key={entente.id} value={entente.id}>
                                                    {entente.etudiantNomComplet} - {entente.titre} ({entente.employeurContact})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Quality of Supervision */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.qualiteEncadrement")} *
                                    </label>
                                    <textarea
                                        value={formData.qualiteEncadrement}
                                        onChange={(e) => handleFormChange("qualiteEncadrement", e.target.value)}
                                        placeholder={t("form.qualiteEncadrementPlaceholder")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                {/* Relevance of Missions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.pertinenceMissions")} *
                                    </label>
                                    <textarea
                                        value={formData.pertinenceMissions}
                                        onChange={(e) => handleFormChange("pertinenceMissions", e.target.value)}
                                        placeholder={t("form.pertinenceMissionsPlaceholder")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                {/* Respect of Schedules */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.respectHoraires")} *
                                    </label>
                                    <textarea
                                        value={formData.respectHorairesConditions}
                                        onChange={(e) => handleFormChange("respectHorairesConditions", e.target.value)}
                                        placeholder={t("form.respectHorairesPlaceholder")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                {/* Communication */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.communication")} *
                                    </label>
                                    <textarea
                                        value={formData.communicationDisponibilite}
                                        onChange={(e) => handleFormChange("communicationDisponibilite", e.target.value)}
                                        placeholder={t("form.communicationPlaceholder")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                {/* Comments and Suggestions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("form.commentaires")} *
                                    </label>
                                    <textarea
                                        value={formData.commentairesAmelioration}
                                        onChange={(e) => handleFormChange("commentairesAmelioration", e.target.value)}
                                        placeholder={t("form.commentairesPlaceholder")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting || ententes.length === 0}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t("form.submitting")}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {t("form.submit")}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        {t("form.cancel")}
                                    </button>
                                </div>
                            </form>
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
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[140px]">Programme</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">Session</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[160px]">Contact</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">CV</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 min-w-[180px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {etudiants.map((etudiant) => (
                                            <tr key={etudiant.id} className="hover:shadow-sm hover:bg-blue-50/60 transition-all duration-200">
                                                <td className="px-4 py-4 min-w-[200px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <GraduationCap className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">
                                                                {etudiant.prenom} {etudiant.nom}
                                                            </div>
                                                            <div className="text-sm text-gray-500 truncate">{etudiant.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 min-w-[140px]">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{getProgramName(etudiant.progEtude)}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 min-w-[120px]">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate">{etudiant.session} {etudiant.annee}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 min-w-[160px]">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                                            <span className="text-xs truncate">{etudiant.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                                            <span className="text-xs truncate">{etudiant.telephone}</span>
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
        </>
    );
};

export default ProfesseurEvaluationMilieuStage;
