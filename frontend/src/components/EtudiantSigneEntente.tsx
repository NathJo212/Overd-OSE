import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, FileText, Calendar, DollarSign, AlertCircle, FileSignature, Edit } from "lucide-react";
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
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [modificationText, setModificationText] = useState('');

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
            setSelectedEntente(null);
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

    const handleModifyEntente = async () => {
        if (!selectedEntente || !modificationText.trim()) {
            setError(t('errors.modificationRequired'));
            return;
        }

        try {
            setActionLoading(true);
            await etudiantService.modifierEntente(selectedEntente.id, {
                commentaires: modificationText
            });
            setSuccessMessage(t('success.modificationSent'));
            setShowModifyModal(false);
            setSelectedEntente(null);
            setModificationText('');
            await loadEntentes();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Erreur lors de la modification:', err);
            setError(err.response?.data?.erreur?.message || t('errors.modifyError'));
        } finally {
            setActionLoading(false);
        }
    };

    const closeAllModals = () => {
        setShowSignModal(false);
        setShowRefuseModal(false);
        setShowModifyModal(false);
        setSelectedEntente(null);
        setModificationText('');
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

        if (entente.etudiantSignature === 'SIGNE') {
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
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800">{successMessage}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">{t('loading')}</p>
                    </div>
                )}

                {/* Ententes List */}
                {!loading && ententes.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">{t('noEntentes')}</p>
                    </div>
                )}

                {!loading && ententes.length > 0 && (
                    <div className="grid grid-cols-1 gap-6">
                        {ententes.map((entente: any) => (
                            <div
                                key={entente.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {entente.titre || t('fields.defaultTitle')}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {entente.description || t('fields.noDescription')}
                                        </p>
                                    </div>
                                    {getStatutBadge(entente)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">
                                            {t('fields.startDate')}: {formatDate(entente.dateDebut)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">
                                            {t('fields.endDate')}: {formatDate(entente.dateFin)}
                                        </span>
                                    </div>
                                    {entente.horaire && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{entente.horaire}</span>
                                        </div>
                                    )}
                                    {entente.remuneration && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{entente.remuneration}$ / {t('fields.perHour')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
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
                                                    setShowModifyModal(true);
                                                }}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                {t('buttons.modify')}
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
            {selectedEntente && !showSignModal && !showRefuseModal && !showModifyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {(selectedEntente as any).titre || t('fields.defaultTitle')}
                                </h3>
                                {getStatutBadge(selectedEntente)}
                            </div>
                            <button
                                onClick={() => setSelectedEntente(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {(selectedEntente as any).description && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>{t('fields.description')}:</strong> {(selectedEntente as any).description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t('fields.startDate')}
                                    </label>
                                    <p className="text-gray-900 mt-1 font-semibold">{formatDate((selectedEntente as any).dateDebut)}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t('fields.endDate')}
                                    </label>
                                    <p className="text-gray-900 mt-1 font-semibold">{formatDate((selectedEntente as any).dateFin)}</p>
                                </div>
                            </div>

                            {(selectedEntente as any).horaire && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {t('fields.schedule')}
                                    </label>
                                    <p className="text-gray-900 mt-1">{(selectedEntente as any).horaire}</p>
                                </div>
                            )}

                            {(selectedEntente as any).dureeHebdomadaire && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{t('fields.hoursPerWeek')}</label>
                                    <p className="text-gray-900 mt-1 font-semibold">{(selectedEntente as any).dureeHebdomadaire} {t('fields.hours')}</p>
                                </div>
                            )}

                            {(selectedEntente as any).remuneration && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        {t('fields.remuneration')}
                                    </label>
                                    <p className="text-gray-900 mt-1 font-semibold">{(selectedEntente as any).remuneration}$ / {t('fields.perHour')}</p>
                                </div>
                            )}

                            {(selectedEntente as any).responsabilites && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{t('fields.responsibilities')}</label>
                                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{(selectedEntente as any).responsabilites}</p>
                                </div>
                            )}

                            {(selectedEntente as any).objectifs && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{t('fields.objectives')}</label>
                                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{(selectedEntente as any).objectifs}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t-2 border-gray-300">
                                <h4 className="font-semibold text-gray-900 mb-3">{t('signatureStatus.title')}</h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">{t('signatureStatus.yourSignature')}</span>
                                    {(selectedEntente as any).etudiantSignature === 'SIGNE' ? (
                                        <span className="text-green-600 flex items-center gap-2 font-semibold">
                                            <CheckCircle className="w-5 h-5" />
                                            {t('signatureStatus.signed')}
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 flex items-center gap-2 font-semibold">
                                            <Clock className="w-5 h-5" />
                                            {t('signatureStatus.waiting')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {peutSigner(selectedEntente) && (
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowSignModal(true)}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                                >
                                    <FileSignature className="w-5 h-5" />
                                    {t('buttons.sign')}
                                </button>
                                <button
                                    onClick={() => setShowModifyModal(true)}
                                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-5 h-5" />
                                    {t('buttons.modify')}
                                </button>
                                <button
                                    onClick={() => setShowRefuseModal(true)}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                                >
                                    <XCircle className="w-5 h-5" />
                                    {t('buttons.refuse')}
                                </button>
                            </div>
                        )}
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

            {/* Modal de modification */}
            {showModifyModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('modals.modify.title')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {t('modals.modify.subtitle')}
                                </p>
                            </div>
                            <button
                                onClick={closeAllModals}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('modals.modify.label')}
                            </label>
                            <textarea
                                value={modificationText}
                                onChange={(e) => setModificationText(e.target.value)}
                                placeholder={t('modals.modify.placeholder')}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={closeAllModals}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleModifyEntente}
                                disabled={actionLoading || !modificationText.trim()}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {t('buttons.sending')}
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-4 h-4" />
                                        {t('buttons.sendRequest')}
                                    </>
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