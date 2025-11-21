import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Calendar,
    DollarSign,
    AlertCircle,
    FileSignature,
    ArrowLeft
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar.tsx";
import etudiantService from '../services/EtudiantService.ts';
import type { EntenteStageDTO } from '../services/EtudiantService.ts';

const EtudiantSigneEntente = () => {
    const { t } = useTranslation('ententes');
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

    const loadEntentes = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await etudiantService.getEntentesEnAttente();
            console.log('Ententes en attente chargées:', data);
            setEntentes(data);
        } catch (err: any) {
            console.error('Erreur lors du chargement des ententes:', err);
            setError(t('errors.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSignEntente = async () => {
        if (!selectedEntente) return;

        try {
            setActionLoading(true);
            await etudiantService.signerEntente(selectedEntente.id);
            setSuccessMessage(t('success.signed'));
            setShowSignModal(false);
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
            setSuccessMessage(t('success.refused'));
            setShowRefuseModal(false);
            // Update local state: mark as refused but keep in the list
            setEntentes(prev => prev.map(e => e.id === selectedEntente.id ? { ...e, etudiantSignature: 'REFUSEE', statut: 'REFUSEE' } : e));
            setSelectedEntente(null);

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

    const peutSigner = (entente: any) => {
        return entente.etudiantSignature === 'EN_ATTENTE' && entente.statut === 'EN_ATTENTE';
    };

    const getStatutBadge = (entente: any) => {
        if (entente.statut === 'REFUSEE') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
                    <XCircle className="w-3.5 h-3.5" />
                    {t('status.refused')}
                </span>
            );
        }

        if (entente.etudiantSignature === 'EN_ATTENTE') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    {t('status.waitingYourSignature')}
                </span>
            );
        }

        if (entente.etudiantSignature === 'SIGNEE') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('status.youSigned')}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                <Clock className="w-3.5 h-3.5" />
                {entente.statut}
            </span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('common.notDefined');
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Bouton retour */}
                <button
                    onClick={() => navigate('/dashboard-etudiant')}
                    className="mb-6 flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">{t('buttons.backToDashboard')}</span>
                </button>


                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600 dark:text-slate-300">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-slate-300">{t('loading')}</p>
                    </div>
                )}

                {/* Ententes List */}
                {!loading && ententes.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-slate-300 text-lg">{t('noEntentes')}</p>
                    </div>
                )}

                {!loading && ententes.length > 0 && (
                    <div className="grid grid-cols-1 gap-6">
                        {ententes.map((entente: any) => (
                            <div
                                key={entente.id}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                                            {entente.titre || t('fields.defaultTitle')}
                                        </h3>
                                        <p className="text-gray-600 dark:text-slate-300 text-sm">
                                            {entente.description || t('fields.noDescription')}
                                        </p>
                                    </div>
                                    {getStatutBadge(entente)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                        <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                        <span className="text-sm">
                                            {t('fields.startDate')}: {formatDate(entente.dateDebut)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                        <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                        <span className="text-sm">
                                            {t('fields.endDate')}: {formatDate(entente.dateFin)}
                                        </span>
                                    </div>
                                    {entente.horaire && (
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                            <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            <span className="text-sm">{entente.horaire}</span>
                                        </div>
                                    )}
                                    {entente.remuneration && (
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                            <DollarSign className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            <span className="text-sm">{entente.remuneration}$ / {t('fields.perHour')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setSelectedEntente(entente)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {t('buttons.viewDetails')}
                                    </button>

                                    {peutSigner(entente) && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedEntente(entente);
                                                    setShowSignModal(true);
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                                            >
                                                <FileSignature className="w-4 h-4" />
                                                {t('buttons.sign')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedEntente(entente);
                                                    setShowRefuseModal(true);
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                {t('buttons.refuse')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de détails */}
            {selectedEntente && !showSignModal && !showRefuseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                                    {(selectedEntente as any).titre || t('fields.defaultTitle')}
                                </h3>
                                {getStatutBadge(selectedEntente)}
                            </div>
                            <button
                                onClick={() => setSelectedEntente(null)}
                                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Full entente/offre display */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{(selectedEntente as any).titre || t('fields.defaultTitle')}</h4>

                                <div className="grid gap-3 text-sm text-gray-700 dark:text-slate-300">
                                    <div>
                                        <strong>{t('fields.description')}:</strong>
                                        <p className="mt-1 text-gray-800 dark:text-slate-200">{(selectedEntente as any).description || t('fields.noDescription')}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-2">
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.program')}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).progEtude || (selectedEntente as any).prog || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.location')}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).lieuStage || (selectedEntente as any).lieu || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.schedule')}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).horaire || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.weeklyHours')}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).dureeHebdomadaire ?? '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.remuneration')}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{(selectedEntente as any).remuneration || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.period')}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{formatDate((selectedEntente as any).dateDebut)} → {formatDate((selectedEntente as any).dateFin)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.responsibilities')}</div>
                                        <div className="mt-1 text-gray-800 dark:text-slate-200">{(selectedEntente as any).responsabilites || '-'}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">{t('fields.objectives')}</div>
                                        <div className="mt-1 text-gray-800 dark:text-slate-200">{(selectedEntente as any).objectifs || '-'}</div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800 text-sm text-gray-800 dark:text-slate-200">
                                    <div className="grid gap-1">
                                        <div>{(selectedEntente as any).etudiantPrenom} {(selectedEntente as any).etudiantNom} • {(selectedEntente as any).etudiantEmail}</div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('fields.program')}: {(selectedEntente as any).progEtude || '-'}</div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('fields.session')}: {(selectedEntente as any).session || (selectedEntente as any).etudiantSession || '-'}</div>
                                        <div className="mt-2">{(selectedEntente as any).employeurNom || ''}</div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('fields.email')}: {(selectedEntente as any).employeurEmail || (selectedEntente as any).employeurCourriel || '-'}</div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400">{t('fields.telephone')}: {(selectedEntente as any).employeurTelephone || (selectedEntente as any).employeurTel || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures summary: show both student and employer like employer modal */}
                            <div className="pt-4 border-t-2 border-gray-300 dark:border-slate-700">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">{t('signatureStatus.title')}</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                                        <span className="font-medium text-gray-700 dark:text-slate-200">{t('signatureStatus.yourSignature')}</span>
                                        {(selectedEntente as any).etudiantSignature === 'SIGNEE' ? (
                                            <span className="text-green-600 dark:text-green-400 flex items-center gap-2 font-semibold">
                                                <CheckCircle className="w-5 h-5" />
                                                {t('signatureStatus.signed')}
                                            </span>
                                        ) : (selectedEntente as any).etudiantSignature === 'REFUSEE' ? (
                                            <span className="text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold">
                                                <XCircle className="w-5 h-5" />
                                                {t('signatureStatus.refused')}
                                            </span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-2 font-semibold">
                                                <Clock className="w-5 h-5" />
                                                {t('signatureStatus.pending')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                                        <span className="font-medium text-gray-700 dark:text-slate-200">{t('signatureStatus.employerSignature') || t('signatureStatus.employer')}</span>
                                        {(selectedEntente as any).employeurSignature === 'SIGNEE' ? (
                                            <span className="text-green-600 dark:text-green-400 flex items-center gap-2 font-semibold">
                                                <CheckCircle className="w-5 h-5" />
                                                {t('signatureStatus.signed')}
                                            </span>
                                        ) : (selectedEntente as any).employeurSignature === 'REFUSEE' ? (
                                            <span className="text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold">
                                                <XCircle className="w-5 h-5" />
                                                {t('signatureStatus.refused')}
                                            </span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-2 font-semibold">
                                                <Clock className="w-5 h-5" />
                                                {t('signatureStatus.waiting')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setSelectedEntente(null)}
                                className="cursor-pointer flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                {t('modal.close')}
                            </button>
                            {peutSigner(selectedEntente) && (
                                <>
                                    <button
                                        onClick={() => setShowSignModal(true)}
                                        className="cursor-pointer flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FileSignature className="w-5 h-5" />
                                        {t('buttons.sign')}
                                    </button>
                                    <button
                                        onClick={() => setShowRefuseModal(true)}
                                        className="cursor-pointer flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        {t('buttons.refuse')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de signature */}
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
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleSignEntente}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

            {/* Modal de confirmation de refus */}
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
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleRefuseEntente}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

export default EtudiantSigneEntente;

