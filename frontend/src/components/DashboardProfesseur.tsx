import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Phone, Calendar, AlertCircle, Users, BookOpen, Download, FileX, FileText, Briefcase, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { professeurService, type EtudiantDTO, type CandidatureDTO, type EntenteStageDTO, type StatutStageDTO } from "../services/ProfesseurService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

const DashboardProfesseur = () => {
    const { t, i18n } = useTranslation("dashboardProfesseur");
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [professorName, setProfessorName] = useState("");
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);
    const [downloadingLettre, setDownloadingLettre] = useState<number | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
    const [candidatures, setCandidatures] = useState<CandidatureDTO[]>([]);
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [loadingCandidatures, setLoadingCandidatures] = useState(false);
    const [loadingEntentes, setLoadingEntentes] = useState(false);
    const [viewMode, setViewMode] = useState<'candidatures' | 'ententes' | null>(null);
    const [statutsStage, setStatutsStage] = useState<Record<number, StatutStageDTO>>({});
    const token = sessionStorage.getItem("authToken") || "";

    const chargerEtudiants = async () => {
        try {
            setLoading(true);
            const data = await professeurService.getMesEtudiants(token);
            setEtudiants(data);
        } catch (e: any) {
            setError(e.message || t('error.unknown'));
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
            setError(t('error.authTokenMissing'));
            return;
        }

        chargerEtudiants();
    }, [navigate, token, t]);

    const handleDownloadCV = async (etudiant: EtudiantDTO) => {
        if (!etudiant.id) return;

        try {
            setDownloadingCV(etudiant.id);
            const blob = await professeurService.telechargerCV(etudiant.id, token);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `CV_${etudiant.prenom}_${etudiant.nom}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors du téléchargement du CV:', error);
            alert(t('error.downloadCVFailed'));
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
            alert("Erreur lors du chargement des candidatures");
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
            alert("Erreur lors du chargement des ententes");
        } finally {
            setLoadingEntentes(false);
        }
    };

    const handleDownloadLettre = async (candidatureId: number) => {
        try {
            setDownloadingLettre(candidatureId);
            const blob = await professeurService.telechargerLettreMotivation(candidatureId, token);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Lettre_Motivation_${candidatureId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors du téléchargement de la lettre:', error);
            alert("Erreur lors du téléchargement de la lettre");
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

    const getStatutStageDisplay = (statut: StatutStageDTO) => {
        const config: Record<string, { text: string, Icon: any, color: string }> = {
            'PAS_COMMENCE': { text: 'Pas commencé', Icon: Clock, color: 'text-gray-600' },
            'EN_COURS': { text: 'En cours', Icon: CheckCircle, color: 'text-blue-600' },
            'TERMINE': { text: 'Terminé', Icon: CheckCircle, color: 'text-green-600' },
        };

        // Fallback if statut doesn't match
        const statusConfig = config[statut] || { text: statut, Icon: Clock, color: 'text-gray-600' };
        const { text, Icon, color } = statusConfig;

        return (
            <span className={`flex items-center gap-1 ${color}`}>
                <Icon className="w-4 h-4" />
                {text}
            </span>
        );
    };

    const renderCVColumn = (etudiant: EtudiantDTO) => {
        if (!etudiant.cv || etudiant.cv.length === 0) {
            return (
                <div className="flex items-center gap-2 text-gray-400">
                    <FileX className="w-4 h-4" />
                    <span className="text-sm">{t('studentList.cv.noCV')}</span>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleDownloadCV(etudiant)}
                disabled={downloadingCV === etudiant.id}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {downloadingCV === etudiant.id ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="text-sm">{t('studentList.cv.downloading')}</span>
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        <span className="text-sm">{t('studentList.cv.download')}</span>
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                        {professorName && ` - ${professorName}`}
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle')}
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

                <div className="bg-white rounded-2xl shadow-md border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            {t('studentList.title')}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    ) : etudiants.length === 0 ? (
                        <div className="p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-gray-600">{t('studentList.noStudents')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.student')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.program')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.session')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.contact')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        CV
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                {etudiants.map((etudiant) => (
                                    <tr key={etudiant.id} className="hover:bg-blue-50 transition-colors">
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
                                                    {etudiant.progEtude || 'N/A'}
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
                                                    Candidatures
                                                </button>
                                                <button
                                                    onClick={() => etudiant.id && handleViewEntentes(etudiant.id)}
                                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    <Briefcase className="w-4 h-4" />
                                                    Ententes
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
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadge(candidature.statut)}`}>
                                                    {candidature.statut}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                                                <div className="flex items-center gap-2">
                                                    {candidature.alettreMotivation ? (
                                                        <button
                                                            onClick={() => handleDownloadLettre(candidature.id)}
                                                            disabled={downloadingLettre === candidature.id}
                                                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                                                        >
                                                            {downloadingLettre === candidature.id ? (
                                                                <>
                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                    <span>Téléchargement...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="w-4 h-4" />
                                                                    <span>Lettre de motivation</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <FileX className="w-4 h-4" />
                                                            <span className="text-sm">Aucune lettre de motivation</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {candidature.messageReponse && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-700"><strong>Message:</strong> {candidature.messageReponse}</p>
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
                            ) : ententes.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">Aucune entente trouvée</p>
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
                                                            ) : entente.etudiantSignature === 'REFUSEE' ? (
                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">Étudiant: {entente.etudiantSignature}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {entente.employeurSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : entente.employeurSignature === 'REFUSEE' ? (
                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <span className="text-sm text-gray-600">Employeur: {entente.employeurSignature}</span>
                                                        </div>
                                                    </div>

                                                    {statut && (
                                                        <div className="px-4 py-2 bg-blue-50 rounded-lg">
                                                            <div className="text-sm font-semibold text-gray-700">Statut du stage:</div>
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
        </div>
    );
};

export default DashboardProfesseur;