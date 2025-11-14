import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    XCircle,
    FileText,
    Calendar,
    AlertCircle,
    FileSignature,
    ArrowLeft,
    RefreshCw,
    Users,
    Building2,
    GraduationCap
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar.tsx";
import { gestionnaireService } from '../services/GestionnaireService.ts';
import type { EntenteStageDTO } from '../services/GestionnaireService.ts';
import UtilisateurService from "../services/UtilisateurService.ts";

const GestionnaireSigneEntente = () => {
    const { t } = useTranslation(['gestionnaireSigneEntente', 'programmes']);
    const navigate = useNavigate();
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEntente, setSelectedEntente] = useState<EntenteStageDTO | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showSignModal, setShowSignModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const token = UtilisateurService.getToken();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "GESTIONNAIRE") {
            navigate("/login");
            return;
        }

        loadEntentes().then();
    }, [navigate, token]);

    const loadEntentes = async () => {
        try {
            setLoading(true);
            setError('');
            if (!token) throw new Error(t('errors.unauthorized'));
            const data = await gestionnaireService.getEntentesPretes(token);
            console.log('Ententes prêtes chargées:', data);
            setEntentes(data);
        } catch (err: any) {
            console.error('Erreur lors du chargement des ententes:', err);
            const responseData = err.response?.data;
            if (responseData?.erreur) {
                setError(t('errors.errorCode', {
                    code: responseData.erreur.errorCode,
                    message: responseData.erreur.message
                }));
            } else {
                setError(err.message || t('errors.loadError'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (entente: EntenteStageDTO) => {
        setSelectedEntente(entente);
        setShowDetailsModal(true);
    };

    const handleSignClick = (entente: EntenteStageDTO) => {
        setSelectedEntente(entente);
        setShowDetailsModal(false);
        setShowSignModal(true);
    };

    const handleRefuseClick = (entente: EntenteStageDTO) => {
        setSelectedEntente(entente);
        setShowDetailsModal(false);
        setShowRefuseModal(true);
    };

    const handleConfirmSign = async () => {
        if (!selectedEntente || !selectedEntente.id || !token) return;

        try {
            setActionLoading(true);
            setError('');
            await gestionnaireService.signerEntente(selectedEntente.id, token);
            setSuccessMessage(t('success.signed'));
            setShowSignModal(false);
            setSelectedEntente(null);
            await loadEntentes();
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            console.error('Erreur lors de la signature:', err);
            const responseData = err.response?.data;
            if (responseData?.erreur) {
                setError(t('errors.errorCode', {
                    code: responseData.erreur.errorCode,
                    message: responseData.erreur.message
                }));
            } else {
                setError(err.message || t('errors.signError'));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmRefuse = async () => {
        if (!selectedEntente || !selectedEntente.id || !token) return;

        try {
            setActionLoading(true);
            setError('');
            await gestionnaireService.refuserEntente(selectedEntente.id, token);
            setSuccessMessage(t('success.refused'));
            setShowRefuseModal(false);
            setSelectedEntente(null);
            await loadEntentes();
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            console.error('Erreur lors du refus:', err);
            const responseData = err.response?.data;
            if (responseData?.erreur) {
                setError(t('errors.errorCode', {
                    code: responseData.erreur.errorCode,
                    message: responseData.erreur.message
                }));
            } else {
                setError(err.message || t('errors.refuseError'));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowSignModal(false);
        setShowRefuseModal(false);
        setSelectedEntente(null);
    };

    const getProgrammeLabel = (progEtude?: string) => {
        if (!progEtude) return t('fields.notDefined');
        return t(`programmes:${progEtude}`, progEtude);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('fields.notDefined');
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA');
    };

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">{t('loading')}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/dashboard-gestionnaire')}
                            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            {t('backToDashboard')}
                        </button>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                                    {t('title')}
                                </h1>
                                <p className="text-gray-600 dark:text-slate-300 text-lg">{t('subtitle')}</p>
                            </div>
                            <button
                                onClick={loadEntentes}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-md border border-gray-200 dark:border-slate-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t('refresh')}
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Liste des ententes */}
                    {ententes.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
                            <FileSignature className="w-20 h-20 text-gray-300 dark:text-slate-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                                {t('noEntentes')}
                            </h2>
                            <p className="text-gray-600 dark:text-slate-300 max-w-md mx-auto">
                                {t('noEntentesSubtitle')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-slate-700">
                                <p className="text-gray-700 dark:text-slate-300 font-medium">
                                    {ententes.length} {t('ententeCount')}
                                </p>
                            </div>

                            {ententes.map((entente) => (
                                <div
                                    key={entente.id}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700"
                                >
                                    <div className="p-6">
                                        {/* En-tête */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                                                    {entente.titre || t('fields.title')}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        <span className="font-medium">{entente.etudiantNomComplet || t('fields.notDefined')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                                        <Building2 className="w-4 h-4 text-blue-600" />
                                                        <span>{entente.employeurContact || t('fields.notDefined')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-medium text-sm">{t('cards.ready')}</span>
                                            </div>
                                        </div>

                                        {/* Statut des signatures */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-700 dark:text-slate-300">{t('cards.studentSigned')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-700 dark:text-slate-300">{t('cards.employerSigned')}</span>
                                            </div>
                                        </div>

                                        {/* Détails */}
                                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                <span>{formatDate(entente.dateDebut)} → {formatDate(entente.dateFin)}</span>
                                            </div>
                                            {entente.progEtude && (
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                                    <GraduationCap className="w-4 h-4 text-blue-600" />
                                                    <span>{getProgrammeLabel(entente.progEtude)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Boutons d'action */}
                                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                            <button
                                                onClick={() => handleViewDetails(entente)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {t('buttons.viewDetails')}
                                            </button>
                                            <button
                                                onClick={() => handleSignClick(entente)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <FileSignature className="w-4 h-4" />
                                                {t('buttons.sign')}
                                            </button>
                                            <button
                                                onClick={() => handleRefuseClick(entente)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                {t('buttons.refuse')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Détails */}
            {showDetailsModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                            <h2 className="text-2xl font-bold">{t('modals.details.title')}</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Statut des signatures */}
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <FileSignature className="w-5 h-5 text-blue-600" />
                                    {t('signatureStatus.title')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm">{t('signatureStatus.studentSignature')}: {t('signatureStatus.signed')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm">{t('signatureStatus.employerSignature')}: {t('signatureStatus.signed')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Informations de l'étudiant */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">{t('fields.student')}</h3>
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 space-y-2">
                                    <p className="text-gray-700 dark:text-slate-300"><span className="font-medium">Nom:</span> {selectedEntente.etudiantNomComplet || t('fields.notDefined')}</p>
                                    <p className="text-gray-700 dark:text-slate-300"><span className="font-medium">Email:</span> {selectedEntente.etudiantEmail || t('fields.notDefined')}</p>
                                </div>
                            </div>

                            {/* Informations de l'employeur */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">{t('fields.employer')}</h3>
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 space-y-2">
                                    <p className="text-gray-700 dark:text-slate-300"><span className="font-medium">Contact:</span> {selectedEntente.employeurContact || t('fields.notDefined')}</p>
                                    <p className="text-gray-700 dark:text-slate-300"><span className="font-medium">Email:</span> {selectedEntente.employeurEmail || t('fields.notDefined')}</p>
                                </div>
                            </div>

                            {/* Détails du stage */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">{t('fields.title')}</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.startDate')}</p>
                                            <p className="text-gray-900 dark:text-slate-200 font-medium">{formatDate(selectedEntente.dateDebut)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.endDate')}</p>
                                            <p className="text-gray-900 dark:text-slate-200 font-medium">{formatDate(selectedEntente.dateFin)}</p>
                                        </div>
                                    </div>
                                    {selectedEntente.horaire && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.schedule')}</p>
                                            <p className="text-gray-900 dark:text-slate-200">{selectedEntente.horaire}</p>
                                        </div>
                                    )}
                                    {selectedEntente.dureeHebdomadaire && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.weeklyHours')}</p>
                                            <p className="text-gray-900 dark:text-slate-200">{selectedEntente.dureeHebdomadaire} {t('hourShort')}/{t('week')}</p>
                                        </div>
                                    )}
                                    {selectedEntente.remuneration && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.remuneration')}</p>
                                            <p className="text-gray-900 dark:text-slate-200">{selectedEntente.remuneration}</p>
                                        </div>
                                    )}
                                    {selectedEntente.description && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.description')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{selectedEntente.description}</p>
                                        </div>
                                    )}
                                    {(selectedEntente as any).responsabilitesEtudiant && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('modal.responsabilitesEtudiant')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{(selectedEntente as any).responsabilitesEtudiant}</p>
                                        </div>
                                    )}
                                    {(selectedEntente as any).responsabilitesEmployeur && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('modal.responsabilitesEmployeur')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{(selectedEntente as any).responsabilitesEmployeur}</p>
                                        </div>
                                    )}
                                    {(selectedEntente as any).responsabilitesCollege && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('modal.responsabilitesCollege')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{(selectedEntente as any).responsabilitesCollege}</p>
                                        </div>
                                    )}
                                    {selectedEntente.objectifs && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.objectives')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{selectedEntente.objectifs}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-b-2xl flex gap-3">
                            <button
                                onClick={closeAllModals}
                                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium"
                            >
                                {t('buttons.close')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setShowSignModal(true);
                                }}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <FileSignature className="w-5 h-5" />
                                {t('buttons.sign')}
                            </button>
                            <button
                                onClick={() => handleRefuseClick(selectedEntente)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                {t('buttons.refuse')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Signature */}
            {showSignModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <FileSignature className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('modals.sign.title')}</h2>
                            </div>
                            <p className="text-gray-700 dark:text-slate-300 mb-4">{t('modals.sign.message')}</p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-green-800 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {t('modals.sign.requirements')}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-b-2xl flex gap-3">
                            <button
                                onClick={() => setShowSignModal(false)}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmSign}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
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

            {/* Modal Refus */}
            {showRefuseModal && selectedEntente && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('modals.refuse.title')}</h2>
                            </div>
                            <p className="text-gray-700 dark:text-slate-300 mb-4">{t('modals.refuse.message')}</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {t('modals.refuse.warning')}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-b-2xl flex gap-3">
                            <button
                                onClick={() => setShowRefuseModal(false)}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmRefuse}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        {t('buttons.refusing')}
                                    </>
                                ) : (
                                    t('buttons.confirm')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GestionnaireSigneEntente;
