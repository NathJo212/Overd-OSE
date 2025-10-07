import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, X, User, Mail, Phone, GraduationCap, Calendar, FileText } from "lucide-react";
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
            console.error('Erreur lors de l\'approbation:', e);

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

        setProcessingId(refuseTargetId);
        setActionMessage("");
        setError("");
        setShowRefuseModal(false);

        try {
            await gestionnaireService.refuserCV(refuseTargetId!, refuseReason, token);
            setActionMessage('cvmanager:messages.refusedSuccess');
            await chargerCVs();
        } catch (e: any) {
            console.error('Erreur lors du refus:', e);

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
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                    <div className="text-xl text-gray-600">Chargement des CVs...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {t("cvmanager:page.title")}
                        </h1>
                        <p className="text-gray-600">{t("cvmanager:page.manageResumes")}</p>
                    </div>

                    {actionMessage && (
                        <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    <span>{t(actionMessage)}</span>
                                </div>
                                <button
                                    onClick={() => setActionMessage("")}
                                    className="text-green-700 hover:text-green-900"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    <span>{t(error)}</span>
                                </div>
                                <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {etudiants.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-600">{t("cvmanager:messages.noResumes")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {etudiants.map((etudiant) => (
                                <div key={etudiant.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <span className="font-semibold text-gray-800 text-lg">
                                                        {etudiant.prenom} {etudiant.nom}
                                                    </span>
                                                    <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                        {t("cvmanager:messages.pending")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span>{etudiant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span>{etudiant.telephone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-gray-400" />
                                                    <span>{tProgrammes(etudiant.progEtude?.code || '')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span>{etudiant.session} {etudiant.annee}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => handleViewCV(etudiant)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                                            >
                                                <FileText className="h-4 w-4" />
                                                {t("cvmanager:actions.viewCV")}
                                            </button>
                                            <button
                                                onClick={() => handleApprove(etudiant.id!)}
                                                disabled={processingId === etudiant.id}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                {processingId === etudiant.id ? t("cvmanager:actions.sending") : t("cvmanager:actions.approve")}
                                            </button>
                                            <button
                                                onClick={() => handleRefuseClick(etudiant.id!)}
                                                disabled={processingId === etudiant.id}
                                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                                <h3 className="text-xl font-semibold">
                                    {t("cvmanager:cvModal.title")} - {selectedCV.prenom} {selectedCV.nom}
                                </h3>
                                <button onClick={closeCVModal} className="text-white hover:text-gray-200">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                {selectedCV.cv && selectedCV.cv.length > 0 ? (
                                    <iframe
                                        src={`data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(selectedCV.cv)))}`}
                                        className="w-full h-[600px] border rounded"
                                        title="CV Preview"
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">{t("cvmanager:cvModal.noPreview")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de refus */}
                {showRefuseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                            <div className="bg-red-600 text-white p-4 rounded-t-lg">
                                <h3 className="text-xl font-semibold">{t("cvmanager:refuseModal.refuseCV")}</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-700 mb-4">{t("cvmanager:refuseModal.refuseReason")}</p>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("cvmanager:refuseModal.reasonLabel")}
                                </label>
                                <textarea
                                    value={refuseReason}
                                    onChange={(e) => setRefuseReason(e.target.value)}
                                    placeholder={t("cvmanager:refuseModal.reasonPlaceholder")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    rows={4}
                                />
                                {refuseError && (
                                    <p className="mt-2 text-sm text-red-600">{refuseError}</p>
                                )}
                                <div className="mt-6 flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowRefuseModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        {t("cvmanager:actions.cancel")}
                                    </button>
                                    <button
                                        onClick={submitRefuse}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
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