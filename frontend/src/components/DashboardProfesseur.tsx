import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    AlertCircle,
    BookOpen,
    Briefcase,
    Calendar,
    CheckCircle,
    ClipboardList,
    Clock,
    FileText,
    FileX,
    GraduationCap,
    Mail,
    Phone,
    Users,
    X,
    XCircle
} from "lucide-react";
import {
    type CandidatureDTO,
    type CreerEvaluationMilieuStageDTO,
    type EntenteStageDTO,
    type EtudiantDTO,
    professeurService,
    type StatutStageDTO
} from "../services/ProfesseurService";
import NavBar from "./NavBar.tsx";
import {useTranslation} from "react-i18next";
import * as React from "react";

const DashboardProfesseur = () => {
    const { t} = useTranslation(["dashboardProfesseur", "programmes"]);
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [professorName, setProfessorName] = useState("");
    const [downloadingLettre, setDownloadingLettre] = useState<number | null>(null);
    const [, setSelectedStudent] = useState<number | null>(null);
    const [candidatures, setCandidatures] = useState<CandidatureDTO[]>([]);
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [loadingCandidatures] = useState(false);
    const [loadingEntentes] = useState(false);
    const [viewMode, setViewMode] = useState<'candidatures' | 'ententes' | 'evaluation' | null>(null);
    const [statutsStage, setStatutsStage] = useState<Record<number, StatutStageDTO>>({});
    const token = sessionStorage.getItem("authToken") || "";
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>("");

    // Evaluation states
    const [selectedEtudiant, setSelectedEtudiant] = useState<EtudiantDTO | null>(null);
    const [ententesDisponibles, setEntentesDisponibles] = useState<EntenteStageDTO[]>([]);
    const [loadingEntentesDisponibles] = useState(false);
    const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
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


    const closeModal = () => {
        setSelectedStudent(null);
        setViewMode(null);
        setCandidatures([]);
        setEntentes([]);
        setStatutsStage({});
        setSelectedEtudiant(null);
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
    const handleEvaluationFormChange = (field: keyof CreerEvaluationMilieuStageDTO, value: string | number) => {
        setEvaluationForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();

        if (evaluationForm.ententeId === 0) {
            alert("Veuillez sélectionner une entente de stage");
            return;
        }

        try {
            setSubmittingEvaluation(true);
            await professeurService.creerEvaluationMilieuStage(evaluationForm);

            alert("Évaluation créée avec succès!");
            closeModal();

        } catch (error: any) {
            console.error('Erreur lors de la création de l\'évaluation:', error);
            alert(error.message || "Erreur lors de la création de l'évaluation");
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

    const getProgramName = (programCode: string | undefined) => {
        if (!programCode) return 'N/A';
        // Try to get translation from programmes namespace
        return t(`programmes:${programCode}`, {defaultValue: programCode});
    };
    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                        {t('dashboardProfesseur:title')}
                        {professorName && ` - ${professorName}`}
                    </h1>
                    <p className="text-gray-600 dark:text-slate-300">
                        {t('dashboardProfesseur:subtitle')}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {/* Bouton de gestion centré */}
                <div className="mb-8 flex justify-center">
                    <button
                        onClick={() => navigate('/evaluation-milieu-stage')}
                        className="relative bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-2xl p-8 text-white transition-all hover:scale-105 group overflow-hidden max-w-md w-full"
                    >
                        {/* Effet de brillance animé */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        <div className="relative flex flex-col items-center justify-center gap-3">
                            <div className="bg-white/30 p-4 rounded-full group-hover:bg-white/40 transition-colors">
                                <ClipboardList className="w-10 h-10" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-indigo-100">📋 {t('dashboardProfesseur:managementButton.accessTo')}</p>
                                <p className="text-xl font-bold mt-1">{t('dashboardProfesseur:managementButton.title')}</p>
                                <p className="text-xs text-indigo-200 mt-1">{t('dashboardProfesseur:managementButton.subtitle')}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm font-medium">
                                <span>{t('dashboardProfesseur:managementButton.clickHere')}</span>
                                <span className="animate-pulse">→</span>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            {t('dashboardProfesseur:studentList.title')}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    ) : etudiants.length === 0 ? (
                        <div className="p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-slate-300">{t('dashboardProfesseur:studentList.noStudents')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-max">
                                <thead className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-800">
                                <tr>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-200 min-w-[200px]">
                                        {t('dashboardProfesseur:studentList.student')}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-200 min-w-[140px]">
                                        {t('dashboardProfesseur:studentList.program')}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-200 min-w-[120px]">
                                        {t('dashboardProfesseur:studentList.session')}
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-200 min-w-[160px]">
                                        {t('dashboardProfesseur:studentList.contact')}
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {etudiants.map((etudiant) => (
                                    <tr key={etudiant.id} className="hover:shadow-sm hover:bg-blue-50/60 dark:hover:bg-slate-700 transition-all duration-200">
                                        <td className="px-4 py-4 min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-slate-100 truncate">
                                                        {etudiant.prenom} {etudiant.nom}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-slate-400 truncate">{etudiant.email}</div>
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
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{etudiant.session} {etudiant.annee}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 min-w-[160px]">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    <span className="text-xs truncate">{etudiant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                                    <span className="text-xs truncate">{etudiant.telephone}</span>
                                                </div>
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

            {viewMode === 'candidatures' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-purple-600" />
                                {t('dashboardProfesseur:candidatures.title')}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingCandidatures ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />
                                </div>
                            ) : candidatures.length === 0 ? (
                                <p className="text-center text-gray-600 dark:text-slate-300 py-12">{t('dashboardProfesseur:candidatures.noCandidatures')}</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidatures.map((candidature) => (
                                        <div key={candidature.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{candidature.offreTitre}</h4>
                                                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('dashboardProfesseur:ententes.labels.employer')}: {candidature.employeurNom}</p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                                        Date: {new Date(candidature.dateCandidature).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadge(candidature.statut)}`}>
                                                    {getStatutLabel(candidature.statut)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
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
                                                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500">
                                                            <FileX className="w-4 h-4" />
                                                            <span className="text-sm">{t('dashboardProfesseur:candidatures.letterMotivation.none')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {candidature.messageReponse && (
                                                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-800">
                                                    <p className="text-sm text-gray-700 dark:text-slate-300"><strong>{t('dashboardProfesseur:candidatures.message')}:</strong> {candidature.messageReponse}</p>
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

            {viewMode === 'ententes' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-green-600" />
                                {t('dashboardProfesseur:ententes.title')}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingEntentes ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />
                                </div>
                            ) : ententes.length === 0 ? (
                                <p className="text-center text-gray-600 dark:text-slate-300 py-12">{t('dashboardProfesseur:ententes.noEntentes')}</p>
                            ) : (
                                <div className="space-y-4">
                                    {ententes.map((entente) => {
                                        const isSigned = entente.etudiantSignature === 'SIGNEE' && entente.employeurSignature === 'SIGNEE';
                                        const statut = isSigned ? statutsStage[entente.id] : null;

                                        return (
                                            <div key={entente.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{entente.titre}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{entente.description}</p>
                                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboardProfesseur:ententes.labels.employer')}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{entente.employeurContact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboardProfesseur:ententes.labels.location')}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{entente.lieu}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboardProfesseur:ententes.labels.period')}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                                                    {new Date(entente.dateDebut).toLocaleDateString()} - {new Date(entente.dateFin).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboardProfesseur:ententes.labels.weeklyHours')}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{entente.dureeHebdomadaire}h</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            {entente.etudiantSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : entente.etudiantSignature === 'REFUSEE' ? (
                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600 dark:text-slate-300">
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
                                                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                                                {t('dashboardProfesseur:ententes.labels.employer')}: {t(`dashboardProfesseur:ententes.signatures.${entente.employeurSignature}`, entente.employeurSignature)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {statut && (
                                                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                            <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('dashboardProfesseur:ententes.labels.statutStage')}:</div>
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
            {/* Modal d'évaluation */}
            {viewMode === 'evaluation' && selectedEtudiant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6" />
                                    Évaluation du Milieu de Stage
                                </h3>
                                <p className="text-indigo-100 mt-1">
                                    Étudiant: {selectedEtudiant.prenom} {selectedEtudiant.nom}
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
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
                                    <p className="text-gray-600 dark:text-slate-300 text-lg">Aucune entente de stage signée disponible pour évaluation</p>
                                    <p className="text-gray-500 dark:text-slate-400 mt-2">L'étudiant doit avoir une entente signée qui n'a pas encore été évaluée</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitEvaluation} className="space-y-6">
                                    {/* Sélection de l'entente */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                            Entente de stage *
                                        </label>
                                        <select
                                            value={evaluationForm.ententeId}
                                            onChange={(e) => handleEvaluationFormChange("ententeId", Number(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        >
                                            <option value={0}>Sélectionnez une entente...</option>
                                            {ententesDisponibles.map((entente) => (
                                                <option key={entente.id} value={entente.id}>
                                                    {entente.titre} - {entente.employeurContact} ({entente.dateDebut} au {entente.dateFin})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Qualité de l'encadrement */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                            Qualité de l'encadrement *
                                        </label>
                                        <textarea
                                            value={evaluationForm.qualiteEncadrement}
                                            onChange={(e) => handleEvaluationFormChange("qualiteEncadrement", e.target.value)}
                                            placeholder="Décrivez la qualité de l'encadrement fourni par le superviseur de l'entreprise..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Pertinence des missions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                            Pertinence des missions et tâches confiées *
                                        </label>
                                        <textarea
                                            value={evaluationForm.pertinenceMissions}
                                            onChange={(e) => handleEvaluationFormChange("pertinenceMissions", e.target.value)}
                                            placeholder="Évaluez la pertinence des missions confiées à l'étudiant par rapport à son programme d'études..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Respect des horaires */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                            Respect des horaires et conditions convenues *
                                        </label>
                                        <textarea
                                            value={evaluationForm.respectHorairesConditions}
                                            onChange={(e) => handleEvaluationFormChange("respectHorairesConditions", e.target.value)}
                                            placeholder="Commentez sur le respect des horaires de travail et des conditions convenues dans l'entente..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Communication */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                            Communication et disponibilité du superviseur *
                                        </label>
                                        <textarea
                                            value={evaluationForm.communicationDisponibilite}
                                            onChange={(e) => handleEvaluationFormChange("communicationDisponibilite", e.target.value)}
                                            placeholder="Évaluez la communication et la disponibilité du superviseur de l'entreprise..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Commentaires */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                            Commentaires et suggestions pour amélioration *
                                        </label>
                                        <textarea
                                            value={evaluationForm.commentairesAmelioration}
                                            onChange={(e) => handleEvaluationFormChange("commentairesAmelioration", e.target.value)}
                                            placeholder="Fournissez des commentaires constructifs et des suggestions pour améliorer l'expérience de stage..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Boutons */}
                                    <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            type="submit"
                                            disabled={submittingEvaluation}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {submittingEvaluation ? (
                                                <>
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                                            onClick={closeModal}
                                            disabled={submittingEvaluation}
                                            className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-lg font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
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

            {pdfUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{pdfTitle}</h2>
                            <button
                                onClick={() => {
                                    window.URL.revokeObjectURL(pdfUrl);
                                    setPdfUrl(null);
                                }}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-700 dark:text-slate-200" />
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

        </div>
    );
};

export default DashboardProfesseur;

