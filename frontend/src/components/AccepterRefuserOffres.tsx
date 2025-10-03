import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, X, Building2, Mail, Phone, MapPin, Calendar, DollarSign } from "lucide-react";
import { gestionnaireService, type OffreDTO } from "../services/GestionnaireService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

const OffresDeStagesGestionnaire = () => {
    const { t } = useTranslation(["internshipmanager"]);
    const navigate = useNavigate();
    const [offres, setOffres] = useState<OffreDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [actionMessage, setActionMessage] = useState<string>("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [refuseReason, setRefuseReason] = useState("");
    const [refuseTargetId, setRefuseTargetId] = useState<number | null>(null);
    const [refuseError, setRefuseError] = useState("");
    const token = sessionStorage.getItem("authToken") || "";

    const chargerOffres = async () => {
        try {
            setLoading(true);
            const data = await gestionnaireService.getAllOffresDeStages(token);
            setOffres(data);
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
        chargerOffres().then();
    }, [navigate, token]);

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        setActionMessage("");
        try {
            await gestionnaireService.approuverOffre(id, token);
            setActionMessage('internshipmanager:messages.approvedSuccess');
            await chargerOffres();
        } catch (e: any) {
            setError(e.message || 'internshipmanager:messages.approveError');
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
            setRefuseError("La raison est obligatoire.");
            return;
        }
        if (refuseTargetId == null) return;
        setProcessingId(refuseTargetId);
        setActionMessage("");
        setRefuseError("");
        try {
            await gestionnaireService.refuserOffre(refuseTargetId, refuseReason.trim(), token);
            setActionMessage('internshipmanager:messages.refusedSuccess');
            setShowRefuseModal(false);
            await chargerOffres();
        } catch (e: any) {
            setError(e.message || 'internshipmanager:messages.refuseError');
        } finally {
            setProcessingId(null);
        }
    };

    const cancelRefuse = () => {
        setShowRefuseModal(false);
        setRefuseReason("");
        setRefuseTargetId(null);
        setRefuseError("");
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showRefuseModal) {
                cancelRefuse();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showRefuseModal]);

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('internshipmanager:page.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('internshipmanager:page.manageOffers')}
                    </p>
                </div>

                {/* Messages */}
                {actionMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-900">{t(actionMessage)}</p>
                            <button onClick={() => setActionMessage("")} className="ml-auto text-green-600 hover:text-green-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900">{t(error)}</p>
                            <button onClick={() => setError("")} className="ml-auto text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Contenu */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    </div>
                ) : offres.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-gray-600">{t('internshipmanager:messages.noOffers')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {offres.map(offre => (
                            <div
                                key={offre.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-6 border border-slate-200"
                            >
                                {/* En-tête de la carte */}
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 pr-4">{offre.titre}</h2>
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
                                        {t('internshipmanager:messages.pending')}
                                    </span>
                                </div>

                                {/* Info employeur */}
                                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-4 h-4 text-slate-600" />
                                        <span className="font-semibold text-gray-900">{offre.employeurDTO?.nomEntreprise}</span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {offre.employeurDTO?.contact && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500">Contact:</span>
                                                <span>{offre.employeurDTO?.contact}</span>
                                            </div>
                                        )}
                                        {offre.employeurDTO?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-slate-500" />
                                                <span className="text-xs">{offre.employeurDTO?.email}</span>
                                            </div>
                                        )}
                                        {offre.employeurDTO?.telephone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-500" />
                                                <span className="text-xs">{offre.employeurDTO?.telephone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-700 mb-4 leading-relaxed line-clamp-3">
                                    {offre.description}
                                </p>

                                {/* Détails */}
                                <div className="space-y-2 mb-4 text-sm">
                                    {offre.lieuStage && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <span>{offre.lieuStage}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span>{offre.date_debut} → {offre.date_fin}</span>
                                    </div>
                                    {offre.remuneration && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <DollarSign className="w-4 h-4 text-blue-600" />
                                            <span>{offre.remuneration}</span>
                                        </div>
                                    )}
                                    {offre.dateLimite && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4 text-red-600" />
                                            <span className="text-red-600">Limite: {offre.dateLimite}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={() => handleApprove(offre.id)}
                                        disabled={processingId === offre.id}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-green-400 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {processingId === offre.id ? t('internshipmanager:actions.sending') : t('internshipmanager:actions.approve')}
                                    </button>
                                    <button
                                        onClick={() => handleRefuseClick(offre.id)}
                                        disabled={processingId === offre.id}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-400 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        {processingId === offre.id ? t('internshipmanager:actions.sending') : t('internshipmanager:actions.refuse')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de refus */}
            {showRefuseModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) cancelRefuse();
                    }}
                >
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {t('internshipmanager:refuseModal.refuseOffer')}
                            </h2>
                            <button
                                onClick={cancelRefuse}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            {t('internshipmanager:refuseModal.refuseReason')}
                        </p>

                        <label htmlFor="refuse-reason" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('internshipmanager:refuseModal.reasonLabel')}
                        </label>
                        <textarea
                            id="refuse-reason"
                            value={refuseReason}
                            onChange={(e) => {
                                setRefuseReason(e.target.value);
                                if (refuseError) setRefuseError('');
                            }}
                            rows={4}
                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent px-4 py-3 text-sm transition-all"
                            placeholder={t('internshipmanager:refuseModal.reasonPlaceholder')}
                            autoFocus
                        />
                        {refuseError && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>{t('internshipmanager:refuseModal.reasonRequired')}</span>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={submitRefuse}
                                disabled={processingId !== null}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-400 disabled:shadow-none"
                            >
                                {processingId !== null ? t('internshipmanager:actions.sending') : t('internshipmanager:actions.confirm')}
                            </button>
                            <button
                                onClick={cancelRefuse}
                                disabled={processingId !== null}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-200 text-gray-800 font-medium py-3 rounded-xl transition-all duration-200"
                            >
                                {t('internshipmanager:actions.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OffresDeStagesGestionnaire;