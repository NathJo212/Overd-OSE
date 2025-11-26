import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    X,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    GraduationCap,
    FileText,
    FileSignature,
    UserCog,
    Eye
} from "lucide-react";
import { gestionnaireService, type OffreDTO } from "../services/GestionnaireService";
import NavBar from "./NavBar.tsx";
import YearBanner from "./YearBanner/YearBanner.tsx";
import { useTranslation } from "react-i18next";
import { useYear } from "./YearContext/YearContext.tsx";

const DashboardGestionnaire = () => {
    const { t } = useTranslation(["internshipmanager"]);
    const { t: tProgrammes } = useTranslation('programmes');
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

    const chargerOffres = async () => {
        try {
            setLoading(true);
            const data = await gestionnaireService.getAllOffresDeStages(token, selectedYear);
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
    }, [navigate, token, selectedYear]);

    const handleApprove = async (id: number) => {
        if (isViewingPastYear) return; // Empêcher l'action si on regarde une année passée

        setProcessingId(id);
        setActionMessage("");
        setError("");

        try {
            await gestionnaireService.approuverOffre(id, token);
            setActionMessage('internshipmanager:messages.approvedSuccess');
            await chargerOffres();
        } catch (e: any) {
            console.error('Erreur lors de l\'approbation:', e);

            const responseData = e.response?.data;

            if (responseData?.erreur?.errorCode) {
                setError(`errors:${responseData.erreur.errorCode}`);
            } else {
                setError('internshipmanager:messages.approveError');
            }
        } finally {
            setProcessingId(null);
        }
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
        setError("");

        try {
            await gestionnaireService.refuserOffre(refuseTargetId, refuseReason.trim(), token);
            setActionMessage('internshipmanager:messages.refusedSuccess');
            setShowRefuseModal(false);
            await chargerOffres();
        } catch (e: any) {
            console.error('Erreur lors du refus:', e);

            const responseData = e.response?.data;

            if (responseData?.erreur?.errorCode) {
                setError(`errors:${responseData.erreur.errorCode}`);
            } else {
                setError('internshipmanager:messages.refuseError');
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefuseClick = (id: number) => {
        if (isViewingPastYear) return; // Empêcher l'action si on regarde une année passée

        setRefuseTargetId(id);
        setRefuseReason("");
        setRefuseError("");
        setShowRefuseModal(true);
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
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen relative">
            <NavBar />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                        {t('internshipmanager:page.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-slate-300">
                        {t('internshipmanager:page.manageOffers')}
                    </p>
                </div>

                {/* Navigation en cartes - Ces cartes ne sont PAS affectées par l'année */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* CVs des étudiants */}
                    <NavLink
                        to="/cvs-etudiants-gestionnaire"
                        className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-green-400/50 transition-all duration-300 transform hover:scale-105 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <FileText className="w-10 h-10" />
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <span className="text-xs font-bold">→</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navbar:studentResumes')}</h3>
                        <p className="text-green-100 text-sm">{t('internshipmanager:cards.studentResumesDesc')}</p>
                    </NavLink>

                    {/* Ententes de stage */}
                    <NavLink
                        to="/ententes-stage-gestionnaire"
                        className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-purple-400/50 transition-all duration-300 transform hover:scale-105 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <FileSignature className="w-10 h-10" />
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <span className="text-xs font-bold">→</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navbar:internshipAgreements')}</h3>
                        <p className="text-purple-100 text-sm">{t('internshipmanager:cards.internshipAgreementsDesc')}</p>
                    </NavLink>

                    {/* Signer les ententes */}
                    <NavLink
                        to="/gestionnaire-signe-ententes"
                        className="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-orange-400/50 transition-all duration-300 transform hover:scale-105 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <CheckCircle className="w-10 h-10" />
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <span className="text-xs font-bold">→</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navbar:signAgreements')}</h3>
                        <p className="text-orange-100 text-sm">{t('internshipmanager:cards.signAgreementsDesc')}</p>
                    </NavLink>

                    {/* Assigner professeurs */}
                    <NavLink
                        to="/assigner-professeurs"
                        className="group bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-indigo-400/50 transition-all duration-300 transform hover:scale-105 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <UserCog className="w-10 h-10" />
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <span className="text-xs font-bold">→</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navbar:assignTeachers')}</h3>
                        <p className="text-indigo-100 text-sm">{t('internshipmanager:cards.assignTeachersDesc')}</p>
                    </NavLink>

                    {/* Voir toutes les offres */}
                    <NavLink
                        to="/visualiser-offres"
                        className="group bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-teal-400/50 transition-all duration-300 transform hover:scale-105 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Eye className="w-10 h-10" />
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <span className="text-xs font-bold">→</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t("internshipmanager:page.buttonVisualize")}</h3>
                        <p className="text-teal-100 text-sm">{t('internshipmanager:cards.viewOffersDesc')}</p>
                    </NavLink>
                </div>

                {/* Séparateur */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-gray-300 dark:bg-slate-700 flex-1"></div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("offersPendind")}</h2>
                        <div className="h-px bg-gray-300 dark:bg-slate-700 flex-1"></div>
                    </div>
                </div>

                {/* YearBanner - affiche l'avertissement si on regarde une année passée */}
                <YearBanner />

                {/* Messages */}
                {actionMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-900 dark:text-green-200">{t(actionMessage)}</p>
                            <button onClick={() => setActionMessage("")} className="cursor-pointer ml-auto text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">{t(error)}</p>
                            <button onClick={() => setError("")} className="cursor-pointer ml-auto text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200">
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-slate-300">{t('internshipmanager:messages.noOffers')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {offres.map(offre => (
                            <div
                                key={offre.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-6 border border-slate-200 dark:border-slate-700"
                            >
                                {/* En-tête de la carte */}
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 pr-4">{offre.titre}</h2>
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
                                        {t('internshipmanager:messages.pending')}
                                    </span>
                                </div>

                                {/* Info employeur */}
                                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                        <span className="font-semibold text-gray-900 dark:text-slate-100">{offre.employeurDTO?.nomEntreprise}</span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-slate-300">
                                        {offre.employeurDTO?.contact && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 dark:text-slate-400">Contact:</span>
                                                <span>{offre.employeurDTO?.contact}</span>
                                            </div>
                                        )}
                                        {offre.employeurDTO?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                <span className="text-xs text-gray-700 dark:text-slate-300">{offre.employeurDTO?.email}</span>
                                            </div>
                                        )}
                                        {offre.employeurDTO?.telephone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                <span className="text-xs text-gray-700 dark:text-slate-300">{offre.employeurDTO?.telephone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-700 dark:text-slate-300 mb-4 leading-relaxed line-clamp-3">
                                    {offre.description}
                                </p>

                                {/* Détails */}
                                <div className="space-y-2 mb-4 text-sm">
                                    {offre.progEtude && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                            <GraduationCap className="w-4 h-4 text-blue-600" />
                                            <span>{tProgrammes(offre.progEtude)}</span>
                                        </div>
                                    )}
                                    {offre.lieuStage && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <span>{offre.lieuStage}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span>{offre.date_debut} → {offre.date_fin}</span>
                                    </div>
                                    {offre.remuneration && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                            <DollarSign className="w-4 h-4 text-blue-600" />
                                            <span>{offre.remuneration}</span>
                                        </div>
                                    )}
                                    {offre.dateLimite && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                            <Calendar className="w-4 h-4 text-red-600" />
                                            <span className="text-red-600">Limite: {offre.dateLimite}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions - ONLY these buttons are affected by year */}
                                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => handleApprove(offre.id)}
                                        disabled={processingId === offre.id || isViewingPastYear}
                                        className="cursor-pointer flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-green-400 disabled:shadow-none flex items-center justify-center gap-2"
                                        title={isViewingPastYear ? t('yearBanner:warning') : ''}
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {processingId === offre.id ? t('internshipmanager:actions.sending') : t('internshipmanager:actions.approve')}
                                    </button>
                                    <button
                                        onClick={() => handleRefuseClick(offre.id)}
                                        disabled={processingId === offre.id || isViewingPastYear}
                                        className="cursor-pointer flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-400 disabled:shadow-none flex items-center justify-center gap-2"
                                        title={isViewingPastYear ? t('yearBanner:warning') : ''}
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
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fade-in border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                                {t('internshipmanager:refuseModal.refuseOffer')}
                            </h2>
                            <button
                                onClick={cancelRefuse}
                                className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                            {t('internshipmanager:refuseModal.refuseReason')}
                        </p>

                        <label htmlFor="refuse-reason" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
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
                            className="w-full resize-none rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-transparent px-4 py-3 text-sm transition-all"
                            placeholder={t('internshipmanager:refuseModal.reasonPlaceholder')}
                            autoFocus
                        />
                        {refuseError && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span>{t('internshipmanager:refuseModal.reasonRequired')}</span>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={submitRefuse}
                                disabled={processingId !== null}
                                className="cursor-pointer flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-400 disabled:shadow-none"
                            >
                                {processingId !== null ? t('internshipmanager:actions.sending') : t('internshipmanager:actions.confirm')}
                            </button>
                            <button
                                onClick={cancelRefuse}
                                disabled={processingId !== null}
                                className="cursor-pointer flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 font-medium py-3 rounded-xl transition-all duration-200"
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

export default DashboardGestionnaire;