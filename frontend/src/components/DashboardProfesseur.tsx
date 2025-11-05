import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    AlertCircle,
    BookOpen,
    Briefcase,
    Calendar,
    CheckCircle,
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
    type EntenteStageDTO,
    type EtudiantDTO,
    professeurService,
    type StatutStageDTO
} from "../services/ProfesseurService";
import NavBar from "./NavBar.tsx";
import {useTranslation} from "react-i18next";

const DashboardProfesseur = () => {
    const { t} = useTranslation(["dashboardProfesseur", "programmes"]);
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [professorName, setProfessorName] = useState("");
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);
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

        chargerEtudiants();
    }, [navigate, token, t]);

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
            alert(t("dashboardProfesseur:error.downloadCVFailed"));
        } finally {
            setDownloadingCV(null);
        }
    };


    const handleViewCandidatures = async (etudiantId: number) => {
        setSelectedStudent(etudiantId);
        setViewMode('candidatures');
        setLoadingCandidatures(true);
        try {
            const data = await professeurService.getCandidaturesPourEtudiant(etudiantId, token);
            console.log('Candidatures reçues:', data);
            data.forEach(c => {
                console.log(`Candidature ${c.id}: alettreMotivation =`, c.alettreMotivation);
            });
            setCandidatures(data);
        } catch (error) {
            console.error('Erreur lors du chargement des candidatures:', error);
            alert(t('dashboardProfesseur:error.unknown'));
        } finally {
            setLoadingCandidatures(false);
        }
    };

    const handleViewEntentes = async (etudiantId: number) => {
        setSelectedStudent(etudiantId);
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
                    const statut = await professeurService.getStatutStage(entente.id, token);
                    console.log('Statut reçu pour entente', entente.id, ':', statut);
                    statuts[entente.id] = statut;
                } catch (err) {
                    console.error(`Erreur chargement statut entente ${entente.id}:`, err);
                }
            }
            console.log('Tous les statuts:', statuts);
            setStatutsStage(statuts);
        } catch (error) {
            console.error('Erreur lors du chargement des ententes:', error);
            alert(t('dashboardProfesseur:error.unknown'));
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

    const renderCVColumn = (etudiant: EtudiantDTO) => {
        if (!etudiant.cv || etudiant.cv.length === 0) {
            return (
                <div className="flex items-center gap-2 text-gray-400">
                    <FileX className="w-4 h-4" />
                    <span className="text-sm">{t('dashboardProfesseur:studentList.cv.noCV')}</span>
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
                <span className="text-sm">{t('dashboardProfesseur:studentList.cv.view')}</span>
            </button>

        );
    };

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
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
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
                                        {t('dashboardProfesseur:studentList.program')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('dashboardProfesseur:studentList.session')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('dashboardProfesseur:studentList.contact')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        CV
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('dashboardProfesseur:studentList.actions.title', 'Actions')}
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {etudiants.map((etudiant) => (
                                    <tr key={etudiant.id} className="hover:shadow-sm hover:bg-blue-50/60 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {etudiant.prenom} {etudiant.nom}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{etudiant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                    <BookOpen className="w-3 h-3" />
                                                    {getProgramName(etudiant.progEtude)}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{etudiant.session} {etudiant.annee}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-xs">{etudiant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-3 h-3" />
                                                    <span className="text-xs">{etudiant.telephone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderCVColumn(etudiant)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => etudiant.id && handleViewCandidatures(etudiant.id)}
                                                    className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    {t('dashboardProfesseur:studentList.actions.candidatures')}
                                                </button>
                                                <button
                                                    onClick={() => etudiant.id && handleViewEntentes(etudiant.id)}
                                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    <Briefcase className="w-4 h-4" />
                                                    {t('dashboardProfesseur:studentList.actions.ententes')}
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
                                                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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

        </div>
    );
};

export default DashboardProfesseur;