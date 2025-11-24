import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileSignature,
    User,
    Calendar,
    Clock,
    DollarSign,
    AlertCircle,
    Briefcase,
    ArrowLeft,
    CheckCircle,
    RefreshCw,
    X,
    XCircle,
    FileText
} from "lucide-react";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";
import { employeurService, type EntenteStageDTO } from "../services/EmployeurService";
import YearBanner from "./YearBanner.tsx";
import { useYear } from "./YearContext";


const EntentesEmployeurs = () => {
    const { t } = useTranslation(["ententesemployeurs", "programmes"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedEntente, setSelectedEntente] = useState<EntenteStageDTO | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showSignConfirm, setShowSignConfirm] = useState(false);

    const { selectedYear } = useYear();

    // Calculer l'année actuelle (année académique)
    const getCurrentYear = (): number => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11 (0 = janvier, 7 = août)

        // Si nous sommes en août (mois 7) ou après, retourner l'année suivante
        return currentMonth >= 7 ? currentYear + 1 : currentYear;
    };

    const currentYear = getCurrentYear();
    const isViewingPastYear = selectedYear < currentYear;

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }
        loadEntentes().then();
    }, [navigate, selectedYear]);

    const loadEntentes = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await employeurService.getEntentes(selectedYear);
            setEntentes(data);
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleEntenteClick = (entente: EntenteStageDTO) => {
        if (isViewingPastYear) return; // Prevent opening modal for past years
        setSelectedEntente(entente);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowPdfModal(false);
        setSelectedEntente(null);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    const handleSignerClick = async () => {
        if (!selectedEntente) return;
        setActionLoading(true);
        try {
            await employeurService.signerEntente(selectedEntente.id);
            setSuccessMessage(t("ententesemployeurs:messages.signed"));
            setShowSignConfirm(false);
            closeModal();
            await loadEntentes();
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.signError"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRefuserClick = () => {
        setShowModal(false);
        setShowRefuseModal(true);
    };

    const handleConfirmRefuse = async () => {
        if (!selectedEntente) return;

        setActionLoading(true);
        try {
            await employeurService.refuserEntente(selectedEntente.id);
            setSuccessMessage(t("ententesemployeurs:messages.refused"));
            setShowRefuseModal(false);
            setSelectedEntente(null);
            await loadEntentes();
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.refuseError"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewPdf = async (entente: EntenteStageDTO) => {
        if (!entente.id) return;

        try {
            setError('');
            setActionLoading(true);
            const pdfBlob = await employeurService.getPdfEntente(entente.id);
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            setShowPdfModal(true);
        } catch (err: any) {
            console.error('Erreur lors de l\'affichage du PDF:', err);
            setError(t('errors.pdfError'));
        } finally {
            setActionLoading(false);
        }
    };

    const getSignatureStatusBadge = (statut: string) => {
        switch (statut) {
            case 'SIGNEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.signed")}
                    </span>
                );
            case 'EN_ATTENTE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.pending")}
                    </span>
                );
            case 'REFUSEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <X className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.refused")}
                    </span>
                );
            default:
                return null;
        }
    };

    const getProgrammeLabel = (entente: EntenteStageDTO) => {
        const raw = entente.progEtude;
        const prog = raw == null ? '' : String(raw).trim();
        return t(`programmes:${prog}`, { defaultValue: prog });
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="cursor-pointer mb-6 flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t("ententesemployeurs:backToDashboard")}
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {t("ententesemployeurs:title")}
                            </h1>
                            <p className="text-gray-600 dark:text-slate-300">
                                {t("ententesemployeurs:subtitle")}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadEntentes}
                        className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t("ententesemployeurs:refresh")}
                    </button>
                </div>

                {/* YearBanner - affiche l'avertissement si on regarde une année passée */}
                <YearBanner />

                {/* Messages de succès */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-900 dark:text-green-200">{successMessage}</p>
                            <button onClick={() => setSuccessMessage("")} className="cursor-pointer ml-auto text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
                            <button onClick={() => setError("")} className="cursor-pointer ml-auto text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}



                {/* État de chargement */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600" />
                        </div>
                    </div>
                ) : ententes.length === 0 ? (
                    /* Message : Aucune entente */
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <FileSignature className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                            {t("ententesemployeurs:noEntentes.title")}
                        </h3>
                        <p className="text-gray-600 dark:text-slate-300 max-w-md mx-auto">
                            {t("ententesemployeurs:noEntentes.subtitle")}
                        </p>
                    </div>
                ) : (
                    /* Liste des ententes */
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-slate-300">
                                <span className="font-semibold text-gray-900 dark:text-slate-100">{ententes.length}</span> {t("ententesemployeurs:ententeCount")}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {ententes.map((entente) => (
                                <div
                                    key={entente.id}
                                    onClick={() => handleEntenteClick(entente)}
                                    className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg transition-all duration-300 p-6 border border-slate-200 dark:border-slate-700 ${
                                        isViewingPastYear
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:shadow-xl hover:shadow-blue-400/40 cursor-pointer group'
                                    }`}
                                    title={isViewingPastYear ? t('yearBanner:warning') : ''}
                                >
                                    {/* Badge et date */}
                                    <div className="flex flex-col items-start mb-4 gap-1">
                                        {getSignatureStatusBadge(entente.employeurSignature)}
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            {t('fields.createdOn')}: {entente?.dateCreation ? new Date(entente.dateCreation).toLocaleDateString('fr-CA') : ''}
                                        </span>
                                    </div>

                                    {/* Étudiant */}
                                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">
                                                    {entente.etudiantNomComplet}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
                                                    {entente.etudiantEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Titre de l'offre */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                                                {entente.titre}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-1 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.dateDebut} → {entente.dateFin}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.dureeHebdomadaire}{' '}{t('ententesemployeurs:hourShort', { defaultValue: 'h' })}/{t("ententesemployeurs:week")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                            <DollarSign className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.remuneration}</span>
                                        </div>
                                    </div>

                                    {/* Indicateur hover */}
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700 flex items-center gap-2">
                                            {t("ententesemployeurs:viewDetails")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modaux détails de l'entente */}
            {showModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* En-tête du modal */}
                        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900 px-6 py-4 border-b border-blue-100 dark:border-blue-800 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center">
                                        <FileSignature className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {t("ententesemployeurs:modal.title")}
                                        </h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            {selectedEntente.titre}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Contenu du modal */}
                        <div className="p-6 space-y-6">
                            {/* Statuts de signature */}
                            <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">{t("ententesemployeurs:modal.signatures")}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getSignatureStatusBadge(selectedEntente.employeurSignature)}
                                </div>
                            </div>

                            {/* Informations de l'étudiant */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t("ententesemployeurs:modal.student")}
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">{t("ententesemployeurs:modal.name")}:</span> {selectedEntente.etudiantNomComplet}
                                    </p>
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">{t("ententesemployeurs:modal.email")}:</span> {selectedEntente.etudiantEmail}
                                    </p>
                                </div>
                            </div>

                            {/* Informations du stage */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    {t("ententesemployeurs:modal.internshipInfo")}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.startDate")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateDebut}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.endDate")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateFin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.schedule")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.horaire}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.weeklyHours")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dureeHebdomadaire}{' '}{t('ententesemployeurs:hourShort', { defaultValue: 'h' })}/{t("ententesemployeurs:week")}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.programme")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{getProgrammeLabel(selectedEntente)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.location")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).lieuStage || (selectedEntente as any).lieu || t('ententesetudiants:common.notDefined')}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententesemployeurs:modal.remuneration")}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.remuneration}</p>
                                    </div>
                                </div>

                                <div>
                                    {(selectedEntente as any).description && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                                                {t("ententesemployeurs:modal.description")}
                                            </h4>
                                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">
                                                {(selectedEntente as any).description || ''}
                                            </p>
                                        </div>
                                    )}
                                    {(selectedEntente as any).responsabilitesEtudiant && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{t('modal.responsabilitesEtudiant')}</h4>
                                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">{(selectedEntente as any).responsabilitesEtudiant}</p>
                                        </div>
                                    )}

                                    {(selectedEntente as any).responsabilitesEmployeur && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{t('modal.responsabilitesEmployeur')}</h4>
                                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">{(selectedEntente as any).responsabilitesEmployeur}</p>
                                        </div>
                                    )}

                                    {(selectedEntente as any).responsabilitesCollege && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{t('modal.responsabilitesCollege')}</h4>
                                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">{(selectedEntente as any).responsabilitesCollege}</p>
                                        </div>
                                    )}

                                    {(selectedEntente as any).objectifs && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{t('modal.objectives')}</h4>
                                            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">{(selectedEntente as any).objectifs}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pied du modal avec boutons d'action */}
                        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 px-6 py-4 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl">
                            {selectedEntente.gestionnaireSignature === 'SIGNEE' ? (
                                <button
                                    onClick={() => handleViewPdf(selectedEntente)}
                                    className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-5 h-5" />
                                    {t('buttons.viewPdf')}
                                </button>
                            ) : selectedEntente.employeurSignature === 'EN_ATTENTE' && !isViewingPastYear ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        {t("ententesemployeurs:modal.close")}
                                    </button>
                                    <button
                                        onClick={handleRefuserClick}
                                        disabled={actionLoading || isViewingPastYear}
                                        className={`cursor-pointer flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                                            isViewingPastYear ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        title={isViewingPastYear ? t('yearBanner:warning') : ''}
                                    >
                                        <XCircle className="w-5 h-5" />
                                        {t("ententesemployeurs:actions.refuse")}
                                    </button>
                                    <button
                                        onClick={() => setShowSignConfirm(true)}
                                        disabled={actionLoading || isViewingPastYear}
                                        className={`cursor-pointer flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                                            isViewingPastYear ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        title={isViewingPastYear ? t('yearBanner:warning') : ''}
                                    >
                                        <FileSignature className="w-5 h-5" />
                                        {t("ententesemployeurs:actions.sign")}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={closeModal}
                                    className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    {t("ententesemployeurs:modal.close")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de refus */}
            {showRefuseModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="dark:bg-slate-800 bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 rounded-t-2xl border-b border-red-100 dark:border-red-800">
                            <h3 className="text-xl font-bold text-red-900 dark:text-red-200">
                                {t("ententesemployeurs:refuseModal.title")}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-slate-200 mb-4">
                                {t("ententesemployeurs:refuseModal.message")}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRefuseModal(false);
                                    setShowModal(true);
                                }}
                                className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                            >
                                {t("ententesemployeurs:refuseModal.cancel")}
                            </button>
                            <button
                                onClick={handleConfirmRefuse}
                                disabled={actionLoading}
                                className="cursor-pointer px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                {actionLoading ? t("ententesemployeurs:refuseModal.loading") : t("ententesemployeurs:refuseModal.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de signature (employeur) */}
            {showSignConfirm && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="dark:bg-slate-800 bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 rounded-t-2xl border-b border-green-100 dark:border-green-800">
                            <h3 className="text-xl font-bold text-green-900 dark:text-green-200">{t('ententesemployeurs:signModal.title')}</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-slate-200 mb-6">{t('ententesemployeurs:signModal.message')}</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSignConfirm(false)}
                                    className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                                >
                                    {t('ententesemployeurs:signModal.cancel')}
                                </button>
                                <button
                                    onClick={handleSignerClick}
                                    disabled={actionLoading}
                                    className="cursor-pointer px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                >
                                    {actionLoading ? t('ententesemployeurs:signModal.loading') : t('ententesemployeurs:signModal.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal PDF */}
            {showPdfModal && pdfUrl && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
                            <h2 className="text-2xl font-bold">{t('modals.pdf.title')}</h2>
                            <button
                                onClick={() => {
                                    setShowPdfModal(false);
                                    if (pdfUrl) {
                                        URL.revokeObjectURL(pdfUrl);
                                        setPdfUrl(null);
                                    }
                                }}
                                className="cursor-pointer text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full"
                                title="PDF de l'entente"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setShowPdfModal(false);
                                    if (pdfUrl) {
                                        URL.revokeObjectURL(pdfUrl);
                                        setPdfUrl(null);
                                    }
                                }}
                                className="cursor-pointer w-full px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium"
                            >
                                {t('buttons.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntentesEmployeurs;

