import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    DollarSign,
    AlertCircle,
    FileSignature,
    ArrowLeft,
    RefreshCw,
    User, X
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar.tsx";
import etudiantService from '../services/EtudiantService.ts';
import type { EntenteStageDTO } from '../services/EtudiantService.ts';

const EntentesEtudiants = () => {
    const { t } = useTranslation(['ententesetudiants', 'programmes']);
    const navigate = useNavigate();
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEntente, setSelectedEntente] = useState<EntenteStageDTO | null>(null);
    const [showSignModal, setShowSignModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "ETUDIANT") {
            navigate("/login");
            return;
        }

        loadEntentes().then();
    }, [navigate]);

    const loadEntentes = async (): Promise<EntenteStageDTO[]> => {
        try {
            setLoading(true);
            setError('');
            const data = await etudiantService.getEntentes();
            setEntentes(data || []);
            return data || [];
        } catch (err: any) {
            console.error('Erreur lors du chargement des ententes:', err);
            setError(t('errors.loadError'));
            setEntentes([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleSignEntente = async () => {
        if (!selectedEntente) return;

        try {
            setActionLoading(true);
            await etudiantService.signerEntente(selectedEntente.id);

            // Update local state from API result (optimistic update)
            setEntentes(prev => prev.map(e => e.id === selectedEntente.id ? { ...e, etudiantSignature: 'SIGNEE', statut: e.statut ?? 'SIGNEE' } : e));
            setSuccessMessage(t('success.signed'));
            setShowSignModal(false);
            setSelectedEntente(null);

            // refresh from server to ensure consistency
            await loadEntentes();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Erreur lors de la signature:', err);
            setError(err.response?.data?.erreur?.message || t('errors.signError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRefuseEntente = async () => {
        if (!selectedEntente) return;

        try {
            setActionLoading(true);
            await etudiantService.refuserEntente(selectedEntente.id);

            setEntentes(prev => prev.map(e => e.id === selectedEntente.id ? { ...e, etudiantSignature: 'REFUSEE', statut: 'REFUSEE' } : e));
            setSuccessMessage(t('success.refused'));
            setShowRefuseModal(false);
            setSelectedEntente(null);

            await loadEntentes();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Erreur lors du refus:', err);
            setError(err.response?.data?.erreur?.message || t('errors.refuseError'));
        } finally {
            setActionLoading(false);
        }
    };

    const closeAllModals = () => {
        setShowSignModal(false);
        setShowRefuseModal(false);
        setSelectedEntente(null);
        setError('');
    };

    const getSignatureStatusBadge = (statut?: string) => {
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
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.pending")}
                    </span>
                );
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
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-etudiant')}
                        className="cursor-pointer mb-6 flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t('buttons.backToDashboard')}
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {t('title')}
                            </h1>
                            <p className="text-gray-600 dark:text-slate-300">
                                {t('subtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadEntentes}
                        className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('refresh')}
                    </button>
                </div>

                {successMessage && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-slate-300">{t('loading')}</p>
                    </div>
                )}

                {!loading && ententes.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <FileSignature className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{t('noEntentes')}</h3>
                        <p className="text-gray-600 dark:text-slate-300 max-w-md mx-auto">{t('noEntentesSubtitle')}</p>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-slate-300">
                                <span className="font-semibold text-gray-900 dark:text-slate-100">{ententes.length}</span> {t('ententeCount')}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {ententes.map((entente: any) => (
                                <div
                                    key={entente.id}
                                    onClick={() => setSelectedEntente(entente)}
                                    role="button"
                                    tabIndex={0}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400/40 transition-all duration-300 p-6 border border-slate-200 dark:border-slate-700 cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        {getSignatureStatusBadge(entente.etudiantSignature)}
                                        <span className="text-xs text-gray-500 dark:text-slate-400">{t('fields.createdOn')}: {entente?.dateCreation ? new Date(entente.dateCreation).toLocaleDateString('fr-CA') : ''}</span>
                                    </div>

                                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <FileSignature className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">{entente.offreTitre || entente.titre || t('fields.defaultTitle')}</h3>
                                                <p className="text-xs text-gray-600 dark:text-slate-300 truncate">{entente.description || t('fields.noDescription')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.dateDebut} → {entente.dateFin}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.nombreHeuresParSemaine ?? entente.dureeHebdomadaire ?? '-'}{" "}{t('hourShort', { defaultValue: 'h' })}/{t('week')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                            <DollarSign className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.salaire ?? entente.remuneration ?? '-' }{entente.salaire ? '$' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700 flex items-center gap-2">
                                            {t('buttons.viewDetails')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de détails */}
            {selectedEntente && !showSignModal && !showRefuseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 px-6 py-4 border-b border-blue-100 dark:border-blue-800 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center">
                                        <FileSignature className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">{t('modal.title')}</h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">{selectedEntente.titre}</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-slate-100">{t("ententesemployeurs:modal.signatures")}</h4>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getSignatureStatusBadge(selectedEntente.etudiantSignature)}
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t('modal.employer')}
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-gray-800 dark:text-slate-200"><span className="font-medium">{t('modal.employerName')}:</span> {selectedEntente.employeurContact}</p>
                                    <p className="text-gray-800 dark:text-slate-200"><span className="font-medium">{t('modal.employerEmail')}:</span> {selectedEntente.employeurEmail}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2"><FileSignature className="w-5 h-5 text-blue-600" />{t('modal.internshipInfo')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.startDate')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateDebut}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.endDate')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateFin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.schedule')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).horaire ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.weeklyHours')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dureeHebdomadaire}{' '}{t('hourShort', { defaultValue: 'h' })}/{t('week')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('fields.programme')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{getProgrammeLabel(selectedEntente)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('fields.location') || 'Lieu'}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).lieuStage || (selectedEntente as any).lieu || t('common.notDefined')}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.remuneration')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.remuneration}</p>
                                    </div>
                                </div>
                            </div>

                            {(selectedEntente as any).description && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{t('modal.description')}</h4>
                                    <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">{selectedEntente.description}</p>
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

                        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 px-6 py-4 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl">
                            {selectedEntente.etudiantSignature === 'EN_ATTENTE' ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => { setSelectedEntente(null); }}
                                        className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        {t('buttons.close')}
                                    </button>
                                    <button
                                        onClick={() => { setShowRefuseModal(true); }}
                                        className="cursor-pointer flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        {t('buttons.refuse')}
                                    </button>
                                    <button
                                        onClick={() => { setShowSignModal(true); }}
                                        className="cursor-pointer flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        {t('buttons.sign')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedEntente(null)}
                                    className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    {t('modal.close')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals confirmation */}
            {showSignModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                            <FileSignature className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            {t('modals.sign.title')}
                        </h3>
                        <p className="text-gray-700 mb-6 text-center">
                            {t('modals.sign.message')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={closeAllModals}
                                disabled={actionLoading}
                                className="cursor-pointer flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleSignEntente}
                                disabled={actionLoading}
                                className="cursor-pointer flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {t('buttons.signing')}
                                    </>
                                ) : (
                                    t('buttons.confirm')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRefuseModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            {t('modals.refuse.title')}
                        </h3>
                        <p className="text-gray-700 mb-6 text-center">
                            {t('modals.refuse.message')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={closeAllModals}
                                disabled={actionLoading}
                                className="cursor-pointer flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleRefuseEntente}
                                disabled={actionLoading}
                                className="cursor-pointer flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {t('buttons.refusing')}
                                    </>
                                ) : (
                                    t('buttons.confirmRefuse')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntentesEtudiants;
