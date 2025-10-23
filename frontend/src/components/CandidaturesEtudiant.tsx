import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Search,
    Briefcase,
    RefreshCw,
    ArrowLeft,
    Building2,
    Calendar,
    Check,
    X,
    AlertTriangle
} from 'lucide-react';
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";
import { etudiantService, type CandidatureEtudiantDTO } from "../services/EtudiantService";

const CandidaturesEtudiant = () => {
    const { t } = useTranslation(["candidaturesetudiant"]);
    const navigate = useNavigate();
    const [candidatures, setCandidatures] = useState<CandidatureEtudiantDTO[]>([]);
    const [filteredCandidatures, setFilteredCandidatures] = useState<CandidatureEtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // États pour les actions d'acceptation/refus
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [candidatureToAction, setCandidatureToAction] = useState<CandidatureEtudiantDTO | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "ETUDIANT") {
            navigate("/login");
            return;
        }

        loadCandidatures();
    }, [navigate]);

    useEffect(() => {
        filterCandidatures();
    }, [searchTerm, statusFilter, candidatures]);

    const loadCandidatures = async () => {
        try {
            setLoading(true);
            setError("");

            const candidaturesData = await etudiantService.getMesCandidatures();
            setCandidatures(candidaturesData);
        } catch (err: any) {
            setError(err.message || t('errors.loading'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterCandidatures = () => {
        let filtered = [...candidatures];

        // Filter by status
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(c => c.statut === statusFilter);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.offreTitre.toLowerCase().includes(term) ||
                c.employeurNom.toLowerCase().includes(term)
            );
        }

        setFilteredCandidatures(filtered);
    };

    // Actions pour accepter/refuser les offres
    const handleAccept = (candidature: CandidatureEtudiantDTO) => {
        setCandidatureToAction(candidature);
        setShowAcceptModal(true);
    };

    const handleRefuse = (candidature: CandidatureEtudiantDTO) => {
        setCandidatureToAction(candidature);
        setShowRefuseModal(true);
    };

    const confirmAccept = async () => {
        if (!candidatureToAction) return;

        try {
            setActionLoading(true);
            setActionError(null);

            await etudiantService.accepterOffreApprouvee(candidatureToAction.id);

            // Mettre à jour le statut localement
            setCandidatures(prev =>
                prev.map(c =>
                    c.id === candidatureToAction.id
                        ? { ...c, statut: 'ACCEPTEE_PAR_ETUDIANT' }
                        : c
                )
            );

            setActionSuccess(t('messages.acceptSuccess'));
            setShowAcceptModal(false);
            setCandidatureToAction(null);

        } catch (error: any) {
            console.error('Erreur acceptation:', error);
            const message = error?.response?.data?.erreur?.message || error?.message || t('errors.acceptError');
            setActionError(message);
        } finally {
            setActionLoading(false);
            setTimeout(() => {
                setActionSuccess(null);
                setActionError(null);
            }, 4000);
        }
    };

    const confirmRefuse = async () => {
        if (!candidatureToAction) return;

        try {
            setActionLoading(true);
            setActionError(null);

            await etudiantService.refuserOffreApprouvee(candidatureToAction.id);

            // Mettre à jour le statut localement
            setCandidatures(prev =>
                prev.map(c =>
                    c.id === candidatureToAction.id
                        ? { ...c, statut: 'REFUSEE_PAR_ETUDIANT' }
                        : c
                )
            );

            setActionSuccess(t('messages.refuseSuccess'));
            setShowRefuseModal(false);
            setCandidatureToAction(null);

        } catch (error: any) {
            console.error('Erreur refus:', error);
            const message = error?.response?.data?.erreur?.message || error?.message || t('errors.refuseError');
            setActionError(message);
        } finally {
            setActionLoading(false);
            setTimeout(() => {
                setActionSuccess(null);
                setActionError(null);
            }, 4000);
        }
    };

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case "EN_ATTENTE":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        {t('status.pending')}
                    </span>
                );
            case "ACCEPTEE":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('status.acceptedByEmployer')}
                    </span>
                );
            case "ACCEPTEE_PAR_ETUDIANT":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('status.acceptedByStudent')}
                    </span>
                );
            case "REFUSEE":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        {t('status.refusedByEmployer')}
                    </span>
                );
            case "REFUSEE_PAR_ETUDIANT":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        {t('status.refusedByStudent')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {statut}
                    </span>
                );
        }
    };

    const getStatusCount = (statut: string) => {
        if (statut === "ALL") return candidatures.length;
        return candidatures.filter(c => c.statut === statut).length;
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <NavBar />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-lg text-gray-600">{t('loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-etudiant')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{t('backToDashboard')}</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Messages de succès/erreur */}
                {actionSuccess && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                            <p className="text-sm text-green-800">{actionSuccess}</p>
                        </div>
                    </div>
                )}

                {actionError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                            <p className="text-sm text-red-800">{actionError}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-400 mr-3" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('search')}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Filter className="inline w-4 h-4 mr-1" />
                                {t('filterByStatus')}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">{t('filters.all')} ({getStatusCount("ALL")})</option>
                                <option value="EN_ATTENTE">{t('filters.pending')} ({getStatusCount("EN_ATTENTE")})</option>
                                <option value="ACCEPTEE">{t('filters.acceptedByEmployer')} ({getStatusCount("ACCEPTEE")})</option>
                                <option value="ACCEPTEE_PAR_ETUDIANT">{t('filters.acceptedByStudent')} ({getStatusCount("ACCEPTEE_PAR_ETUDIANT")})</option>
                                <option value="REFUSEE">{t('filters.refusedByEmployer')} ({getStatusCount("REFUSEE")})</option>
                                <option value="REFUSEE_PAR_ETUDIANT">{t('filters.refusedByStudent')} ({getStatusCount("REFUSEE_PAR_ETUDIANT")})</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.total')}</p>
                                <p className="text-2xl font-bold text-gray-900">{getStatusCount("ALL")}</p>
                            </div>
                            <Briefcase className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.pending')}</p>
                                <p className="text-2xl font-bold text-yellow-600">{getStatusCount("EN_ATTENTE")}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.accepted')}</p>
                                <p className="text-2xl font-bold text-green-600">{getStatusCount("ACCEPTEE") + getStatusCount("ACCEPTEE_PAR_ETUDIANT")}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.refused')}</p>
                                <p className="text-2xl font-bold text-red-600">{getStatusCount("REFUSEE") + getStatusCount("REFUSEE_PAR_ETUDIANT")}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Candidatures List */}
                {filteredCandidatures.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('noCandidatures.title')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || statusFilter !== "ALL"
                                ? t('noCandidatures.noResults')
                                : t('noCandidatures.neverApplied')}
                        </p>
                        {!searchTerm && statusFilter === "ALL" && (
                            <button
                                onClick={() => navigate("/dashboard-etudiant")}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Briefcase className="w-5 h-5 mr-2" />
                                {t('noCandidatures.viewOffers')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCandidatures.map((candidature) => (
                            <div
                                key={candidature.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {candidature.offreTitre}
                                        </h3>
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <Building2 className="w-4 h-4 mr-2" />
                                            {candidature.employeurNom}
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {t('appliedOn')} {formatDate(candidature.dateCandidature)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        {getStatusBadge(candidature.statut)}

                                        {/* Boutons d'action pour les offres acceptées par l'employeur */}
                                        {candidature.statut === 'ACCEPTEE' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAccept(candidature)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    {t("actions.accept")}
                                                </button>
                                                <button
                                                    onClick={() => handleRefuse(candidature)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    {t("actions.refuse")}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {candidature.messageReponse && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">{t('employerMessage')}</p>
                                        <p className="text-sm text-gray-600">{candidature.messageReponse}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de confirmation d'acceptation */}
            {showAcceptModal && candidatureToAction && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("acceptModal.title")}
                                </h3>
                            </div>

                            <p className="text-gray-600 mb-4">
                                {t("acceptModal.message")}
                            </p>

                            <div className="bg-gray-50 rounded-lg p-3 mb-6">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    {t("acceptModal.offerInfo")}
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                    {candidatureToAction.offreTitre}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {candidatureToAction.employeurNom}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAcceptModal(false);
                                        setCandidatureToAction(null);
                                    }}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    {t("actions.cancel")}
                                </button>
                                <button
                                    onClick={confirmAccept}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? t("actions.sending") : t("actions.confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de refus */}
            {showRefuseModal && candidatureToAction && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <X className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("refuseModal.title")}
                                </h3>
                            </div>

                            <p className="text-gray-600 mb-4">
                                {t("refuseModal.message")}
                            </p>

                            <div className="bg-gray-50 rounded-lg p-3 mb-6">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    {t("refuseModal.offerInfo")}
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                    {candidatureToAction.offreTitre}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {candidatureToAction.employeurNom}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRefuseModal(false);
                                        setCandidatureToAction(null);
                                    }}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    {t("actions.cancel")}
                                </button>
                                <button
                                    onClick={confirmRefuse}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? t("actions.sending") : t("actions.confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidaturesEtudiant;