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
    GraduationCap, Eye
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
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [docsUrls, setDocsUrls] = useState<{ contract?: string | null; evalStagiaire?: string | null; evalProf?: string | null }>({});
    // docsPresence[id] === null  => loading
    // docsPresence[id] === { ... } => loaded
    const [docsPresence, setDocsPresence] = useState<Record<number, { contract: boolean; evalStagiaire: boolean; evalProf: boolean } | null>>({});
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'toSign' | 'signed'>('toSign');
    const [initialLoading, setInitialLoading] = useState(true);

    const token = UtilisateurService.getToken();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "GESTIONNAIRE") {
            navigate("/login");
            return;
        }

        // premier chargement
        loadEntentes(activeTab, true);
    }, []);

    const loadEntentes = async (tab: 'toSign' | 'signed' = 'toSign', isInitial = false) => {
        try {
            if (isInitial) setInitialLoading(true);
            setError('');

            if (!token) throw new Error(t('errors.unauthorized'));

            let data: EntenteStageDTO[] = [];

            if (tab === 'toSign') {
                data = await gestionnaireService.getEntentesPretes(token);
            } else {
                data = await gestionnaireService.getEntentesFini(token);
            }

            setEntentes(data);

            // Charger la présence des documents pour chaque entente (parallèle)
            if (data && data.length > 0) {
                // Marquer toutes les ententes comme 'loading' d'abord (afin d'éviter flicker Manquant -> Présent)
                const initialMap: Record<number, null> = {};
                data.forEach(e => {
                    if (e.id != null) initialMap[e.id] = null;
                });
                setDocsPresence(prev => ({ ...initialMap, ...prev }));

                const presenceTasks = data.map(async (e) => {
                    try {
                        if (e.id == null) return { id: e.id, presence: { contract: false, evalStagiaire: false, evalProf: false } };
                        const docs = await gestionnaireService.getDocumentsEntente(e.id, token!);
                        if (!docs) return { id: e.id, presence: { contract: false, evalStagiaire: false, evalProf: false } };
                        return { id: e.id, presence: { contract: !!docs.contract, evalStagiaire: !!docs.evaluationStagiaire, evalProf: !!docs.evaluationMilieuStage } };
                    } catch (err) {
                        return { id: e.id, presence: { contract: false, evalStagiaire: false, evalProf: false } };
                    }
                });

                const results = await Promise.all(presenceTasks);
                const map: Record<number, { contract: boolean; evalStagiaire: boolean; evalProf: boolean }> = {};
                results.forEach(r => {
                    if (r && r.id != null) map[r.id] = r.presence;
                });
                // Fusionner les résultats sur le state (remplacer les null par les valeurs réelles)
                setDocsPresence(prev => ({ ...prev, ...map }));
            }
        } catch (err: any) {
            setError(err.message || t('errors.loadError'));
        } finally {
            if (isInitial) setInitialLoading(false);
            setLoading(false);
        }
    };


    // Charge la présence des documents pour une entente spécifique si non déjà connue
    const loadEntenteDocsPresence = async (ententeId?: number) => {
        // autoriser ententeId = 0
        if (ententeId == null || !token) return;
        try {
            // si une entrée existe déjà (même null pour loading), ne rien faire
            if ((docsPresence as any)[ententeId] !== undefined) return; // déjà chargé ou en cours
            // marquer comme loading
            setDocsPresence(prev => ({ ...prev, [ententeId]: null }));
            const docs = await gestionnaireService.getDocumentsEntente(ententeId, token);
            setDocsPresence(prev => ({
                ...prev,
                [ententeId]: { contract: !!docs?.contract, evalStagiaire: !!docs?.evaluationStagiaire, evalProf: !!docs?.evaluationMilieuStage }
            }));
        } catch (err) {
            // en cas d'erreur, mettez false pour éviter de bloquer l'UI
            setDocsPresence(prev => ({ ...prev, [ententeId]: { contract: false, evalStagiaire: false, evalProf: false } }));
        }
    };

    const handleViewDetails = (entente: EntenteStageDTO) => {
        setSelectedEntente(entente);
        // s'assurer que la présence des documents est connue avant d'ouvrir
        loadEntenteDocsPresence(entente.id);
        setShowDetailsModal(true);
    };


    // Ouvre un document spécifique pour une entente (contract | evalStagiaire | evalProf)
    const handleViewSpecificDocument = async (ententeId?: number, docKey?: 'contract' | 'evalStagiaire' | 'evalProf') => {
        if (!ententeId || !docKey || !token) return;
        try {
            setActionLoading(true);
            setError('');
            const docs = await gestionnaireService.getDocumentsEntente(ententeId, token);
            if (!docs) {
                setError(t('errors.noDocuments'));
                return;
            }

            let blob: Blob | null = null;
            if (docKey === 'contract') blob = docs.contract ?? null;
            else if (docKey === 'evalStagiaire') blob = docs.evaluationStagiaire ?? null;
            else if (docKey === 'evalProf') blob = docs.evaluationMilieuStage ?? null;

            if (!blob) {
                setError(t('errors.noDocuments'));
                return;
            }

            // revoke previous pdfUrl if any
            if (pdfUrl) {
                try { URL.revokeObjectURL(pdfUrl); } catch (e) {}
            }
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPdfModal(true);
        } catch (err: any) {
            console.error('Erreur handleViewSpecificDocument:', err);
            setError(err.message || t('errors.pdfError'));
        } finally {
            setActionLoading(false);
        }
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
            console.log('Signature de l\'entente ID:', selectedEntente.id);
            await gestionnaireService.signerEntente(selectedEntente.id, token);
            console.log('Signature réussie, rechargement des ententes...');
            setSuccessMessage(t('success.signed'));
            setShowSignModal(false);
            setSelectedEntente(null);
            await loadEntentes();
            console.log('Ententes rechargées après signature');
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
        setShowPdfModal(false);
        setSelectedEntente(null);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        // revoke any docs URLs
        if (docsUrls.contract) {
            try { URL.revokeObjectURL(docsUrls.contract); } catch (e) {}
        }
        if (docsUrls.evalStagiaire) {
            try { URL.revokeObjectURL(docsUrls.evalStagiaire); } catch (e) {}
        }
        if (docsUrls.evalProf) {
            try { URL.revokeObjectURL(docsUrls.evalProf); } catch (e) {}
        }
        setDocsUrls({});
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

    if (initialLoading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <RefreshCw className="w-16 h-16 animate-spin text-blue-600" />
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
                            className="cursor-pointer flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 transition-colors"
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
                                onClick={() => loadEntentes(activeTab)}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-md border border-gray-200 dark:border-slate-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t('refresh')}
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                            {/* Toggle onglets */}
                            <div className="flex w-full rounded-md shadow-sm bg-white dark:bg-slate-800 p-1 border border-gray-200 dark:border-slate-700">
                                <button
                                    onClick={() => { setActiveTab('toSign'); loadEntentes('toSign'); }}
                                    className={`cursor-pointer flex-1 first:rounded-l-md last:rounded-r-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'toSign' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-slate-300'}`}
                                >
                                    {t('tabs.toSign', 'Prêtes à signer')}
                                </button>
                                <button
                                    onClick={() => { setActiveTab('signed'); loadEntentes('signed'); }}
                                    className={`cursor-pointer flex-1 first:rounded-l-md last:rounded-r-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'signed' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-slate-300'}`}
                                >
                                    {t('tabs.signed', 'Signées')}
                                </button>
                            </div>
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

                    {loading && !initialLoading && (
                        <div className="flex justify-center py-4">
                            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
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
                                    {ententes.length} {activeTab === 'toSign' ? t('ententeReadyCount', 'Prêtes à signer') : t('ententeSignedCount', 'Signées')}
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
                                            {/* Indicateur d'état adapté à l'onglet */}
                                            {activeTab === 'signed' || entente.gestionnaireSignature === 'SIGNEE' ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium text-sm">{t('cards.signed')}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium text-sm">{t('cards.ready')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Statut des signatures */}
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-700 dark:text-white">{t('cards.studentSigned')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-700 dark:text-slate-300">{t('cards.employerSigned')}</span>
                                            </div>
                                            {entente.gestionnaireSignature === 'SIGNEE' && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                                    <span className="text-gray-700 dark:text-slate-300">{t('cards.managerSigned')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {activeTab === 'signed' && (
                                            <div className="mb-4">
                                                <div className="text-sm text-gray-700 dark:text-slate-300 w-full">
                                                    <div className="font-semibold text-base mb-2">{t('documents.title')}</div>

                                                    <div className="flex flex-wrap gap-6">
                                                        {[
                                                            { key: 'contract', label: t('documents.contract') },
                                                            { key: 'evalStagiaire', label: t('documents.evalStagiaire') },
                                                            { key: 'evalProf', label: t('documents.evalProf') }
                                                        ].map((doc) => {
                                                            // Entente.id peut valoir 0 -> vérifier contre null/undefined
                                                            const presenceEntry = entente.id != null ? (docsPresence as any)[entente.id as number] : undefined;
                                                            const isLoading = presenceEntry == null;
                                                            const present = !isLoading && !!presenceEntry?.[doc.key];

                                                            return (
                                                                <div key={doc.key} className="flex items-center gap-3">
                                                                    <span className="font-medium">{doc.label}</span>

                                                                    {isLoading ? (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-800/30">
                                                                            {/* petit loader visuel — on garde simple pour éviter d'ajouter une dépendance */}
                                                                            <svg className="w-4 h-4 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                                            </svg>
                                                                            <span className="ml-1">{t('documents.loading')}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span
                                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${present ? 'text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-300' : 'text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300'}`}
                                                                            aria-label={present ? t('documents.present') : t('documents.missing')}
                                                                        >
                                                                            {present ? (
                                                                                <CheckCircle className="w-4 h-4" />
                                                                            ) : (
                                                                                <XCircle className="w-4 h-4" />
                                                                            )}
                                                                            <span className="ml-1">{present ? t('documents.present') : t('documents.missing')}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                            {activeTab === 'signed' ? (
                                                <div className="flex-1 flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleViewDetails(entente)}
                                                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {t('buttons.viewDetails')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleViewDetails(entente)}
                                                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {t('buttons.viewDetails')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleSignClick(entente)}
                                                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        <FileSignature className="w-4 h-4" />
                                                        {t('buttons.sign')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRefuseClick(entente)}
                                                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        {t('buttons.refuse')}
                                                    </button>
                                                </>
                                            )}
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
                                        <span className="text-sm dark:text-white">{t('signatureStatus.studentSignature')}: {t('signatureStatus.signed')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm dark:text-white">{t('signatureStatus.employerSignature')}: {t('signatureStatus.signed')}</span>
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
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.responsabilitesEtudiant')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{(selectedEntente as any).responsabilitesEtudiant}</p>
                                        </div>
                                    )}
                                    {(selectedEntente as any).responsabilitesEmployeur && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.responsabilitesEmployeur')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{(selectedEntente as any).responsabilitesEmployeur}</p>
                                        </div>
                                    )}
                                    {(selectedEntente as any).responsabilitesCollege && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.responsabilitesCollege')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{(selectedEntente as any).responsabilitesCollege}</p>
                                        </div>
                                    )}
                                    {selectedEntente.objectifs && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{t('fields.objectives')}</p>
                                            <p className="text-gray-700 dark:text-slate-300">{selectedEntente.objectifs}</p>
                                        </div>
                                    )}
                                    {/* Section documents: uniquement visible si le gestionnaire a signé l'entente */}
                                    {selectedEntente.gestionnaireSignature === 'SIGNEE' && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">{t('documents.title')}</h3>
                                            <div className="flex gap-3 flex-wrap">
                                                { (docsPresence[selectedEntente.id ?? -1] == null) ? (
                                                    <p className="text-gray-600 dark:text-slate-300">{t('documents.loading')}</p>
                                                ) : (
                                                    <>
                                                        {docsPresence[selectedEntente.id ?? -1]?.contract && (
                                                            <button
                                                                onClick={() => handleViewSpecificDocument(selectedEntente.id, 'contract')}
                                                                className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                <span>{t('documents.voirContract')}</span>
                                                            </button>
                                                        )}

                                                        {docsPresence[selectedEntente.id ?? -1]?.evalStagiaire && (
                                                            <button
                                                                onClick={() => handleViewSpecificDocument(selectedEntente.id, 'evalStagiaire')}
                                                                className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                <span>{t('documents.voirEvalStagiaire')}</span>
                                                            </button>
                                                        )}

                                                        {docsPresence[selectedEntente.id ?? -1]?.evalProf && (
                                                            <button
                                                                onClick={() => handleViewSpecificDocument(selectedEntente.id, 'evalProf')}
                                                                className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                <span>{t('documents.voirEvalProf')}</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-b-2xl">
                            <button
                                onClick={closeAllModals}
                                className="cursor-pointer w-full px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium"
                            >
                                {t('buttons.close')}
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
                                className="cursor-pointer flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmSign}
                                disabled={actionLoading}
                                className="cursor-pointer flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
                                className="cursor-pointer flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmRefuse}
                                disabled={actionLoading}
                                className="cursor-pointer flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
                                <XCircle className="w-6 h-6" />
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
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPdfModal(false);
                                        if (pdfUrl) {
                                            URL.revokeObjectURL(pdfUrl);
                                            setPdfUrl(null);
                                        }
                                    }}
                                    className="cursor-pointer flex-1 cursor-pointer px-6 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium"
                                >
                                    {t('buttons.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GestionnaireSigneEntente;
