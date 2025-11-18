import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    X,
    User,
    Mail,
    Phone,
    GraduationCap,
    Calendar,
    FileText,
    ArrowLeft
} from "lucide-react";
import { gestionnaireService, type EtudiantDTO } from "../services/GestionnaireService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

const ApprouverRefuserCV = () => {
    const { t } = useTranslation(["cvmanager", "errors"]);
    const { t: tProgrammes } = useTranslation('programmes');
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [actionMessage, setActionMessage] = useState<string>("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [refuseReason, setRefuseReason] = useState("");
    const [refuseTargetId, setRefuseTargetId] = useState<number | null>(null);
    const [refuseError, setRefuseError] = useState("");
    const [selectedCV, setSelectedCV] = useState<EtudiantDTO | null>(null);
    const [showCVModal, setShowCVModal] = useState(false);
    const token = sessionStorage.getItem("authToken") || "";

    const chargerCVs = async () => {
        try {
            setLoading(true);
            const data = await gestionnaireService.getAllCVsEnAttente(token);
            setEtudiants(data);
        } catch (e: any) {
            setError(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "GESTIONNAIRE") {
            navigate("/login");
            return;
        }
        if (!token) {
            setError("Token d'authentification manquant");
            return;
        }
        chargerCVs().then();
    }, [navigate, token]);

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        setActionMessage("");
        setError("");

        try {
            await gestionnaireService.approuverCV(id, token);
            setActionMessage('cvmanager:messages.approvedSuccess');
            await chargerCVs();
        } catch (e: any) {
            const responseData = e.response?.data;
            if (responseData?.erreur?.errorCode) {
                setError(`errors:${responseData.erreur.errorCode}`);
            } else {
                setError('cvmanager:messages.approveError');
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefuseClick = (id: number) => {
        setRefuseTargetId(id);
        setRefuseReason("");
        setRefuseError("");
        setShowRefuseModal(true);
    };

    const submitRefuse = async () => {
        if (!refuseReason.trim()) {
            setRefuseError(t("cvmanager:refuseModal.reasonRequired"));
            return;
        }
        if (refuseTargetId == null) return;

        setProcessingId(refuseTargetId);
        setActionMessage("");
        setError("");

        try {
            await gestionnaireService.refuserCV(refuseTargetId, refuseReason.trim(), token);
            setActionMessage('cvmanager:messages.refusedSuccess');
            setShowRefuseModal(false);
            await chargerCVs();
        } catch (e: any) {
            const responseData = e.response?.data;
            if (responseData?.erreur?.errorCode) {
                setError(`errors:${responseData.erreur.errorCode}`);
            } else {
                setError('cvmanager:messages.refuseError');
            }
        } finally {
            setProcessingId(null);
            setRefuseTargetId(null);
        }
    };

    const handleViewCV = (etudiant: EtudiantDTO) => {
        setSelectedCV(etudiant);
        setShowCVModal(true);
    };

    const closeCVModal = () => {
        setShowCVModal(false);
        setSelectedCV(null);
    };

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
                    <div className="text-xl text-gray-600 dark:text-slate-300">Chargement des CVs...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard-gestionnaire')}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t('backToDashboard')}
                    </button>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 border border-slate-200 dark:border-slate-700">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                            {t("cvmanager:page.title")}
                        </h1>
                        <p className="text-gray-600 dark:text-slate-300">{t("cvmanager:page.manageResumes")}</p>
                    </div>

                    {actionMessage && (
                        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-400 dark:border-green-900/40 text-green-700 dark:text-green-200 px-4 py-3 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    <span>{t(actionMessage)}</span>
                                </div>
                                <button
                                    onClick={() => setActionMessage("")}
                                    className="cursor-pointer text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-900/40 text-red-700 dark:text-red-200 px-4 py-3 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    <span>{t(error)}</span>
                                </div>
                                <button onClick={() => setError("")} className="cursor-pointer text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {etudiants.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center border border-slate-200 dark:border-slate-700">
                            <FileText className="h-16 w-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                            <p className="text-xl text-gray-600 dark:text-slate-300">{t("cvmanager:messages.noResumes")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {etudiants.map((etudiant) => (
                                <div key={etudiant.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-slate-200 dark:border-slate-700">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <span className="font-semibold text-gray-800 dark:text-slate-100 text-lg">
                                                        {etudiant.prenom} {etudiant.nom}
                                                    </span>
                                                    <span className="ml-3 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                                                        {t("cvmanager:messages.pending")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                                                    <span>{etudiant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                                                    <span>{etudiant.telephone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                                                    <span>{tProgrammes(etudiant.progEtude || '')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                                                    <span>{etudiant.session} {etudiant.annee}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => handleViewCV(etudiant)}
                                                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                                            >
                                                <FileText className="h-4 w-4" />
                                                {t("cvmanager:actions.viewCV")}
                                            </button>
                                            <button
                                                onClick={() => handleApprove(etudiant.id!)}
                                                disabled={processingId === etudiant.id}
                                                className="cursor-pointer px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                {processingId === etudiant.id ? t("cvmanager:actions.sending") : t("cvmanager:actions.approve")}
                                            </button>
                                            <button
                                                onClick={() => handleRefuseClick(etudiant.id!)}
                                                disabled={processingId === etudiant.id}
                                                className="cursor-pointer px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                {t("cvmanager:actions.refuse")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal de visualisation du CV */}
                {showCVModal && selectedCV && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                                <h3 className="text-xl font-semibold">
                                    {t("cvmanager:cvModal.title")} - {selectedCV.prenom} {selectedCV.nom}
                                </h3>
                                <button onClick={closeCVModal} className="cursor-pointer text-white hover:text-gray-200">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)] bg-white dark:bg-slate-800">
                                {selectedCV.cv && selectedCV.cv.length > 0 ? (
                                    <iframe
                                        src={`data:application/pdf;base64,${selectedCV.cv}`}
                                        className="w-full h-[600px] border rounded dark:border-slate-700"
                                        title="CV Preview"
                                        allow="fullscreen"
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-16 w-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-slate-300">{t("cvmanager:cvModal.noPreview")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de refus */}
                {showRefuseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700">
                            <div className="bg-red-600 text-white p-4 rounded-t-lg">
                                <h3 className="text-xl font-semibold">{t("cvmanager:refuseModal.refuseCV")}</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-700 dark:text-slate-300 mb-4">{t("cvmanager:refuseModal.refuseReason")}</p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                    {t("cvmanager:refuseModal.reasonLabel")}
                                </label>
                                <textarea
                                    value={refuseReason}
                                    onChange={(e) => setRefuseReason(e.target.value)}
                                    placeholder={t("cvmanager:refuseModal.reasonPlaceholder")}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    rows={4}
                                />
                                {refuseError && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{refuseError}</p>
                                )}
                                <div className="mt-6 flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowRefuseModal(false)}
                                        className="cursor-pointer px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200"
                                    >
                                        {t("cvmanager:actions.cancel")}
                                    </button>
                                    <button
                                        onClick={submitRefuse}
                                        className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                                    >
                                        {t("cvmanager:actions.confirm")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ApprouverRefuserCV;

