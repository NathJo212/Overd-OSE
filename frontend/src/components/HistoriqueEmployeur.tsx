import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { employeurService } from '../services/EmployeurService';
import { History, FileText, Users, BookOpen, Award, ArrowLeft, Eye, User, Briefcase, Calendar as CalendarIcon, X, Clock, DollarSign, CheckCircle, FileSignature, Mail, RefreshCw, Search, Filter } from 'lucide-react';

type OngletType = 'candidatures' | 'ententes' | 'evaluations';

const HistoriqueEmployeur = () => {
    const { t } = useTranslation(['historiqueEmployeur']);
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('candidatures');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [filteredCandidatures, setFilteredCandidatures] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // États pour les filtres de candidatures
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [offerFilter, setOfferFilter] = useState('ALL');

    // États pour le modal de candidature
    const [selectedCandidature, setSelectedCandidature] = useState<any | null>(null);
    const [showCandidatureModal, setShowCandidatureModal] = useState(false);

    // États pour la visionneuse de documents (CV, lettre)
    const [selectedDocument, setSelectedDocument] = useState<{ prenom: string; nom: string; cv?: string; lettre?: string } | null>(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    // États pour la visionneuse PDF des évaluations
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>('');
    const [pdfLoading, setPdfLoading] = useState(false);

    // États pour le modal de détails des ententes
    const [selectedEntente, setSelectedEntente] = useState<any | null>(null);
    const [showEntenteModal, setShowEntenteModal] = useState(false);

    // États pour le modal de détails des évaluations
    const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        const role = sessionStorage.getItem('userType');
        if (role !== 'EMPLOYEUR') {
            navigate('/login');
            return;
        }

        // Charger les données au montage
        loadData();
    }, [navigate]);

    useEffect(() => {
        // Recharger les données quand l'année change
        loadData();
    }, [anneeSelectionnee]);

    useEffect(() => {
        // Appliquer les filtres quand les candidatures ou les filtres changent
        filterCandidatures();
    }, [candidatures, searchTerm, statusFilter, offerFilter]);

    const loadData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');
        if (!token) return;

        try {
            // Charger toutes les données en parallèle
            const [candData, entData, evalData] = await Promise.all([
                employeurService.getCandidaturesAvecFiltre(token, anneeSelectionnee),
                employeurService.getEntentesAvecFiltre(token, anneeSelectionnee),
                employeurService.getEvaluationsAvecFiltre(token, anneeSelectionnee),
            ]);

            setCandidatures(candData || []);
            setFilteredCandidatures(candData || []);
            setEntentes(entData || []);
            setEvaluations(evalData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterCandidatures = () => {
        let filtered = [...candidatures];

        // Filtrer par statut
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(c => c.statut === statusFilter);
        }

        // Filtrer par offre
        if (offerFilter !== 'ALL') {
            filtered = filtered.filter(c => c.offreTitre === offerFilter);
        }

        // Filtrer par recherche (nom d'étudiant, email ou titre d'offre)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                (c.etudiantPrenom && c.etudiantPrenom.toLowerCase().includes(term)) ||
                (c.etudiantNom && c.etudiantNom.toLowerCase().includes(term)) ||
                (c.etudiantEmail && c.etudiantEmail.toLowerCase().includes(term)) ||
                (c.offreTitre && c.offreTitre.toLowerCase().includes(term))
            );
        }

        setFilteredCandidatures(filtered);
    };

    const handleAnneeChange = (annee: string) => {
        setAnneeSelectionnee(annee);
    };

    // Ouvrir/fermer le modal de candidature
    const handleOpenCandidatureModal = (candidature: any) => {
        setSelectedCandidature(candidature);
        setShowCandidatureModal(true);
    };

    const handleCloseCandidatureModal = () => {
        setShowCandidatureModal(false);
        setSelectedCandidature(null);
    };

    // Convertir Blob en Base64
    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1] || '';
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    // Regarder le CV
    const handleRegarderCV = async (candidatureId: number) => {
        try {
            const blob = await employeurService.telechargerCvCandidature(candidatureId);
            const base64 = await blobToBase64(blob);

            setSelectedDocument({
                prenom: selectedCandidature?.etudiantPrenom ?? '',
                nom: selectedCandidature?.etudiantNom ?? '',
                cv: base64
            });
            setShowDocumentModal(true);
        } catch (error) {
            console.error('Erreur affichage CV:', error);
            alert('Erreur lors du chargement du CV');
        }
    };

    // Regarder la lettre de motivation
    const handleRegarderLettreMotivation = async (candidatureId: number) => {
        try {
            const blob = await employeurService.telechargerLettreMotivationCandidature(candidatureId);
            const base64 = await blobToBase64(blob);

            setSelectedDocument({
                prenom: selectedCandidature?.etudiantPrenom ?? '',
                nom: selectedCandidature?.etudiantNom ?? '',
                lettre: base64
            });
            setShowDocumentModal(true);
        } catch (error) {
            console.error('Erreur affichage lettre:', error);
            alert('Erreur lors du chargement de la lettre de motivation');
        }
    };

    // Fermer le modal de documents
    const closeDocumentModal = () => {
        setShowDocumentModal(false);
        setSelectedDocument(null);
    };

    const getStatutBadgeClass = (statut: string) => {
        const statusMap: { [key: string]: string } = {
            'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
            'ACCEPTEE': 'bg-green-100 text-green-800',
            'REFUSEE': 'bg-red-100 text-red-800',
            'ACCEPTEE_PAR_ETUDIANT': 'bg-blue-100 text-blue-800',
            'SIGNEE': 'bg-green-100 text-green-800',
        };
        return statusMap[statut] || 'bg-gray-100 text-gray-800';
    };

    // Ouvrir le modal de détails d'évaluation (non utilisé pour le moment)
    // const handleOpenDetailsModal = (evaluation: any) => {
    //     setSelectedEvaluation(evaluation);
    //     setShowDetailsModal(true);
    // };

    // Visualiser directement le PDF d'une évaluation (sans modal intermédiaire)
    const handleViewPdfEvaluation = async (evaluation: any) => {
        try {
            setPdfLoading(true);
            const blob = await employeurService.getPdfEvaluation(evaluation.id);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(`Évaluation de ${evaluation.etudiantPrenom || ''} ${evaluation.etudiantNom || 'Stagiaire'}`);
        } catch (error) {
            console.error('Erreur lors du chargement du PDF:', error);
            alert('Erreur lors du chargement du PDF de l\'évaluation');
        } finally {
            setPdfLoading(false);
        }
    };

    // Visualiser le PDF depuis le modal de détails
    const handleViewPdfFromDetailsModal = async () => {
        if (!selectedEvaluation) return;

        try {
            setPdfLoading(true);
            const blob = await employeurService.getPdfEvaluation(selectedEvaluation.id);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(`Évaluation de ${selectedEvaluation.etudiantPrenom || ''} ${selectedEvaluation.etudiantNom || 'Stagiaire'}`);
        } catch (error) {
            console.error('Erreur lors du chargement du PDF:', error);
            alert('Erreur lors du chargement du PDF de l\'évaluation');
        } finally {
            setPdfLoading(false);
        }
    };

    // Fermer tous les modaux
    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowEntenteModal(false);
        setSelectedEvaluation(null);
        setSelectedEntente(null);
        closePdfViewer();
    };

    // Fermer le modal PDF et révoquer l'URL
    const closePdfViewer = () => {
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
        setPdfTitle('');
        setPdfLoading(false);
    };

    // Ouvrir le modal de détails d'une entente
    const handleEntenteClick = (entente: any) => {
        setSelectedEntente(entente);
        setShowEntenteModal(true);
    };

    // Fermer le modal de détails d'une entente
    const closeEntenteModal = () => {
        setShowEntenteModal(false);
        setSelectedEntente(null);
    };

    // Badge de statut de signature
    const getSignatureStatusBadge = (statut: string) => {
        switch (statut) {
            case 'SIGNEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('agreementModal.signed')}
                    </span>
                );
            case 'EN_ATTENTE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('agreementModal.pending')}
                    </span>
                );
            case 'REFUSEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">
                        <X className="w-3 h-3 mr-1" />
                        {t('agreementModal.refused')}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            <NavBar />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Bouton retour */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="cursor-pointer flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{t('backToDashboard')}</span>
                    </button>
                </div>

                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <History size={32} className="text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('title')}</h1>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Sélecteur d'année */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 border border-transparent dark:border-slate-700">
                    <AnneeAcademiqueSelector
                        onAnneeChange={handleAnneeChange}
                        includeToutes={false}
                    />
                </div>

                {/* Onglets */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-transparent dark:border-slate-700">
                    <div className="border-b border-gray-200 dark:border-slate-700">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setOngletActif('candidatures')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${ongletActif === 'candidatures'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Users size={20} />
                                {t('tabs.applications')} ({candidatures.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('ententes')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${ongletActif === 'ententes'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <BookOpen size={20} />
                                {t('tabs.agreements')} ({ententes.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('evaluations')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${ongletActif === 'evaluations'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Award size={20} />
                                {t('tabs.evaluations')} ({evaluations.length})
                            </button>
                        </nav>
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600 dark:text-slate-300">{t('loading')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Onglet Candidatures */}
                                {ongletActif === 'candidatures' && (
                                    <div>
                                        {/* Filtres */}
                                        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Recherche */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                                        {t('applications.search')}
                                                    </label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            placeholder={t('applications.searchPlaceholder')}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Filtre par statut */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                                        <Filter className="inline w-4 h-4 mr-1" />
                                                        {t('applications.filterByStatus')}
                                                    </label>
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                                    >
                                                        <option value="ALL">{t('applications.allStatuses')} ({candidatures.length})</option>
                                                        <option value="EN_ATTENTE">{t('filters.pending')} ({candidatures.filter(c => c.statut === 'EN_ATTENTE').length})</option>
                                                        <option value="ACCEPTEE">{t('filters.accepted')} ({candidatures.filter(c => c.statut === 'ACCEPTEE').length})</option>
                                                        <option value="ACCEPTEE_PAR_ETUDIANT">{t('status.acceptedByStudent')} ({candidatures.filter(c => c.statut === 'ACCEPTEE_PAR_ETUDIANT').length})</option>
                                                        <option value="REFUSEE">{t('filters.refused')} ({candidatures.filter(c => c.statut === 'REFUSEE').length})</option>
                                                    </select>
                                                </div>
                                                {/* Filtre par offre */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                                        <Briefcase className="inline w-4 h-4 mr-1" />
                                                        {t('applications.filterByOffer')}
                                                    </label>
                                                    <select
                                                        value={offerFilter}
                                                        onChange={(e) => setOfferFilter(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                                    >
                                                        <option value="ALL">{t('applications.allOffers')}</option>
                                                        {Array.from(new Set(candidatures.map(c => c.offreTitre))).sort().map((titre) => (
                                                            <option key={titre} value={titre}>
                                                                {titre} ({candidatures.filter(c => c.offreTitre === titre).length})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {(searchTerm || statusFilter !== 'ALL' || offerFilter !== 'ALL') && (
                                                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                    <Filter className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                    <span className="font-medium text-gray-900 dark:text-slate-100">{filteredCandidatures.length}</span> {t('applications.resultsFound')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Liste des candidatures */}
                                        {filteredCandidatures.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>{searchTerm || statusFilter !== 'ALL' ? t('applications.noFilterMatch') : t('applications.noApplications')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredCandidatures.map((cand) => (
                                                    <div
                                                        key={cand.id}
                                                        onClick={() => handleOpenCandidatureModal(cand)}
                                                        className="border border-gray-200 dark:border-slate-700 rounded-lg p-5 hover:border-blue-300 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800"
                                                    >
                                                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                                            <div className="flex-1 space-y-3">
                                                                {/* Header */}
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div>
                                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                                                            {cand.etudiantPrenom} {cand.etudiantNom}
                                                                        </h3>
                                                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1.5">
                                                                            <FileText className="w-4 h-4" />
                                                                            {cand.offreTitre}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatutBadgeClass(cand.statut)}`}>
                                                                        {cand.statut === 'EN_ATTENTE' ? t('status.pending') :
                                                                            cand.statut === 'ACCEPTEE' ? t('status.accepted') :
                                                                                cand.statut === 'REFUSEE' ? t('status.refused') :
                                                                                    cand.statut === 'ACCEPTEE_PAR_ETUDIANT' ? t('status.acceptedByStudent') :
                                                                                        cand.statut}
                                                                    </span>
                                                                </div>

                                                                {/* Details */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                                        <Mail className="w-4 h-4 text-gray-400 dark:text-slate-400" />
                                                                        <span className="truncate">{cand.etudiantEmail}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                                        <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-slate-400" />
                                                                        {new Date(cand.dateCandidature).toLocaleDateString('fr-CA', {
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Documents */}
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${cand.acv
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                                                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
                                                                        }`}>
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        {t('documents.cv')} {cand.acv ? '✓' : '✗'}
                                                                    </span>
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${cand.alettreMotivation
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                                                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
                                                                        }`}>
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        {t('documents.coverLetter')} {cand.alettreMotivation ? '✓' : '✗'}
                                                                    </span>
                                                                </div>

                                                                {/* Message de réponse si refusée */}
                                                                {cand.statut === 'REFUSEE' && cand.messageReponse && (
                                                                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                                                                        <p className="text-sm text-rose-800 dark:text-rose-200">
                                                                            <span className="font-medium">{t('applications.refusalReasonLabel')}</span> {cand.messageReponse}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Onglet Ententes */}
                                {ongletActif === 'ententes' && (
                                    <div>
                                        {ententes.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>{t('agreements.noAgreements')}</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {ententes.map((entente) => (
                                                    <div
                                                        key={entente.id}
                                                        onClick={() => handleEntenteClick(entente)}
                                                        className="bg-white dark:bg-slate-700 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400/40 dark:hover:shadow-blue-900/40 transition-all duration-300 p-6 border border-slate-200 dark:border-slate-600 cursor-pointer group"
                                                    >
                                                        {/* Badge et date */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            {getSignatureStatusBadge(entente.employeurSignature || entente.statut)}
                                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                                {entente.dateCreation ? new Date(entente.dateCreation).toLocaleDateString('fr-CA') : ''}
                                                            </span>
                                                        </div>

                                                        {/* Étudiant */}
                                                        <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-600">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <User className="w-5 h-5 text-blue-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">
                                                                        {entente.etudiantNomComplet || `${entente.etudiantPrenom || ''} ${entente.etudiantNom || ''}`.trim() || t('agreements.student')}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
                                                                        {entente.etudiantEmail || t('agreements.emailNotAvailable')}
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
                                                                <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                                                <span>{entente.dateDebut} → {entente.dateFin}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                                <span>{entente.dureeHebdomadaire || 'N/A'} {t('agreements.hoursPerWeek')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                                                <DollarSign className="w-3 h-3 flex-shrink-0" />
                                                                <span>{entente.remuneration || t('agreements.notSpecified')}</span>
                                                            </div>
                                                        </div>

                                                        {/* Indicateur hover */}
                                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center gap-2">
                                                                {t('agreements.viewDetails')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Onglet Évaluations */}
                                {ongletActif === 'evaluations' && (
                                    <div>
                                        {evaluations.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <Award size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>{t('evaluations.noEvaluations')}</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {evaluations.map((evaluation) => (
                                                    <div
                                                        key={evaluation.id}
                                                        className="group border-2 border-green-200 dark:border-green-900/40 rounded-2xl p-6 hover:border-green-400 hover:shadow-2xl hover:shadow-green-100 dark:hover:shadow-green-900/20 transition-all bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-slate-800 relative overflow-hidden transform hover:-translate-y-1"
                                                    >
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors" />

                                                        <div className="relative">
                                                            {/* En-tête avec icône et date */}
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                                                    <CheckCircle className="w-6 h-6 text-white" />
                                                                </div>
                                                                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-full text-xs font-bold">
                                                                    {new Date(evaluation.dateEvaluation).toLocaleDateString('fr-CA')}
                                                                </div>
                                                            </div>

                                                            {/* Informations du stagiaire */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <User className="w-4 h-4 text-blue-600" />
                                                                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">{t('evaluationModal.intern')}</span>
                                                                </div>
                                                                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1">
                                                                    {evaluation.etudiantPrenom || ''} {evaluation.etudiantNom || t('evaluationModal.intern')}
                                                                </h3>
                                                                {evaluation.etudiantEmail && (
                                                                    <p className="text-sm text-gray-600 dark:text-slate-300 truncate">
                                                                        {evaluation.etudiantEmail}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Informations du stage */}
                                                            {evaluation.offreTitre && (
                                                                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-slate-600">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Briefcase className="w-4 h-4 text-purple-600" />
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">{t('evaluationModal.internship')}</span>
                                                                    </div>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-2">
                                                                        {evaluation.offreTitre}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Dates du stage */}
                                                            {(evaluation.dateDebut || evaluation.dateFin) && (
                                                                <div className="mb-4 space-y-1">
                                                                    {evaluation.dateDebut && (
                                                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                                                            <CalendarIcon className="w-3 h-3" />
                                                                            <span>{t('evaluationModal.start')}: {evaluation.dateDebut}</span>
                                                                        </div>
                                                                    )}
                                                                    {evaluation.dateFin && (
                                                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                                                            <CalendarIcon className="w-3 h-3" />
                                                                            <span>{t('evaluationModal.end')}: {evaluation.dateFin}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Bouton regarder l'évaluation */}
                                                            <button
                                                                onClick={() => handleViewPdfEvaluation(evaluation)}
                                                                className="cursor-pointer w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group-hover:scale-105 text-sm"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                {t('evaluations.viewEvaluation')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de détails d'une entente */}
            {showEntenteModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* En-tête du modal */}
                        <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 px-6 py-4 border-b border-blue-100 dark:border-blue-800 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center">
                                        <FileSignature className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {t('agreementModal.title')}
                                        </h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            {selectedEntente.titre}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeEntenteModal}
                                    className="cursor-pointer p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-blue-900 dark:text-blue-100" />
                                </button>
                            </div>
                        </div>

                        {/* Contenu du modal */}
                        <div className="p-6 space-y-6">
                            {/* Statuts de signature */}
                            <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">{t('agreementModal.signatureStatus')}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getSignatureStatusBadge(selectedEntente.employeurSignature || selectedEntente.statut)}
                                </div>
                            </div>

                            {/* Informations de l'étudiant */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t('agreementModal.student')}
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">{t('agreementModal.name')}:</span> {selectedEntente.etudiantNomComplet || `${selectedEntente.etudiantPrenom || ''} ${selectedEntente.etudiantNom || ''}`.trim() || t('agreementModal.notAvailable')}
                                    </p>
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">{t('agreementModal.email')}:</span> {selectedEntente.etudiantEmail || t('agreementModal.notAvailable')}
                                    </p>
                                </div>
                            </div>

                            {/* Informations du stage */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    {t('agreementModal.internshipTitle')}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.startDate')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateDebut}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.endDate')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateFin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.schedule')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.horaire || t('agreementModal.notSpecified')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.hoursPerWeek')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dureeHebdomadaire || 'N/A'} {t('agreements.hoursPerWeek')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.program')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.progEtude || t('agreementModal.notSpecified')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.location')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.lieuStage || selectedEntente.lieu || t('agreementModal.notDefined')}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{t('agreementModal.salary')}</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.remuneration || t('agreements.notSpecified')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedEntente.description && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                                        {t('agreementModal.description')}
                                    </h4>
                                    <p className="text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-slate-700/40 p-4 rounded-lg">
                                        {selectedEntente.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pied du modal */}
                        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-700/40 px-6 py-4 border-t border-gray-200 dark:border-slate-600 rounded-b-2xl">
                            <button
                                onClick={closeEntenteModal}
                                className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                {t('agreementModal.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails d'évaluation */}
            {showDetailsModal && selectedEvaluation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-2xl font-bold text-white">
                                {t('evaluationModal.title')}
                            </h2>
                            <button
                                onClick={closeAllModals}
                                className="cursor-pointer text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-5 mb-6 flex items-center gap-4 border border-green-200 dark:border-slate-700">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">{t('evaluationModal.evaluationDate')}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                                        {new Date(selectedEvaluation.dateEvaluation).toLocaleDateString('fr-CA', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6 mb-6 border border-blue-200 dark:border-slate-700">
                                <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t('evaluationModal.internInfo')}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-slate-200">{t('evaluationModal.name')}:</span>
                                        <span className="text-gray-600 dark:text-slate-300">
                                            {selectedEvaluation.etudiantPrenom || ''} {selectedEvaluation.etudiantNom || t('evaluationModal.intern')}
                                        </span>
                                    </div>
                                    {selectedEvaluation.etudiantEmail && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700 dark:text-slate-200">{t('evaluationModal.email')}:</span>
                                            <span className="text-gray-600 dark:text-slate-300">{selectedEvaluation.etudiantEmail}</span>
                                        </div>
                                    )}
                                    {selectedEvaluation.offreTitre && (
                                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-slate-700">
                                            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-2">{t('evaluationModal.stageInfo')}</p>
                                            <p className="font-semibold text-gray-800 dark:text-slate-100 mb-1">{selectedEvaluation.offreTitre}</p>
                                            {(selectedEvaluation.dateDebut || selectedEvaluation.dateFin) && (
                                                <p className="text-gray-600 dark:text-slate-300">
                                                    {selectedEvaluation.dateDebut || 'N/A'} → {selectedEvaluation.dateFin || 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6 text-center border border-gray-200 dark:border-slate-700">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Eye className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-gray-700 dark:text-slate-300 mb-4 font-medium">
                                    Le PDF de cette évaluation est prêt à être regardé.
                                </p>
                                <button
                                    onClick={handleViewPdfFromDetailsModal}
                                    disabled={pdfLoading}
                                    className="cursor-pointer inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {pdfLoading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-5 h-5" />
                                            Regarder le PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-slate-700 px-8 py-5 flex-shrink-0">
                            <button
                                onClick={closeAllModals}
                                className="cursor-pointer w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-xl transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails de candidature */}
            {showCandidatureModal && selectedCandidature && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header Modal */}
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                                    {selectedCandidature.etudiantPrenom} {selectedCandidature.etudiantNom}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Candidature #{selectedCandidature.id}</p>
                            </div>
                            <button
                                onClick={handleCloseCandidatureModal}
                                className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Contenu Modal */}
                        <div className="p-6 space-y-6">
                            {/* Statut */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-200 block mb-2">Statut</label>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatutBadgeClass(selectedCandidature.statut)}`}>
                                    {selectedCandidature.statut === 'EN_ATTENTE' ? 'En attente' :
                                        selectedCandidature.statut === 'ACCEPTEE' ? 'Acceptée' :
                                            selectedCandidature.statut === 'REFUSEE' ? 'Refusée' :
                                                selectedCandidature.statut === 'ACCEPTEE_PAR_ETUDIANT' ? 'Acceptée par étudiant' :
                                                    selectedCandidature.statut}
                                </span>
                            </div>

                            {/* Offre */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-200 block mb-2">Offre de stage</label>
                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <span className="text-blue-900 dark:text-blue-200 font-medium">{selectedCandidature.offreTitre}</span>
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-200 block mb-2">Contact</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
                                        <Mail className="w-5 h-5 text-gray-400 dark:text-slate-400" />
                                        <span>{selectedCandidature.etudiantEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
                                        <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-slate-400" />
                                        <span>Postulé le {new Date(selectedCandidature.dateCandidature).toLocaleDateString('fr-CA', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-200 block mb-3">Documents</label>
                                <div className="space-y-3">
                                    {selectedCandidature.acv && (
                                        <button
                                            onClick={() => handleRegarderCV(selectedCandidature.id)}
                                            className="cursor-pointer w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-gray-900 dark:text-slate-100">Curriculum Vitae</p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-300">Cliquez pour visualiser</p>
                                                </div>
                                            </div>
                                            <Eye className="w-5 h-5 text-gray-400" />
                                        </button>
                                    )}

                                    {selectedCandidature.alettreMotivation && (
                                        <button
                                            onClick={() => handleRegarderLettreMotivation(selectedCandidature.id)}
                                            className="cursor-pointer w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-gray-900 dark:text-slate-100">Lettre de motivation</p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-300">Cliquez pour visualiser</p>
                                                </div>
                                            </div>
                                            <Eye className="w-5 h-5 text-gray-400" />
                                        </button>
                                    )}

                                    {!selectedCandidature.acv && !selectedCandidature.alettreMotivation && (
                                        <p className="text-sm text-gray-500 dark:text-slate-300 text-center py-4">Aucun document disponible</p>
                                    )}
                                </div>
                            </div>

                            {/* Message de réponse si existe */}
                            {selectedCandidature.messageReponse && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-slate-200 block mb-2">Message de réponse</label>
                                    <div className={`rounded-lg p-4 ${selectedCandidature.statut === 'REFUSEE'
                                        ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                        }`}>
                                        <p className={`text-sm ${selectedCandidature.statut === 'REFUSEE'
                                            ? 'text-rose-800 dark:text-rose-200'
                                            : 'text-blue-800 dark:text-blue-200'
                                            }`}>
                                            {selectedCandidature.messageReponse}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-slate-700 p-6">
                            <button
                                onClick={handleCloseCandidatureModal}
                                className="cursor-pointer w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-xl transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de visualisation de documents (CV et Lettre de motivation) */}
            {showDocumentModal && selectedDocument && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
                        {/* En-tête du modal */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                                {selectedDocument.cv ? 'CV' : 'Lettre de motivation'} - {selectedDocument.prenom} {selectedDocument.nom}
                            </h2>
                            <button
                                onClick={closeDocumentModal}
                                className="cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                            </button>
                        </div>
                        {/* Iframe pour afficher le PDF */}
                        <iframe
                            src={`data:application/pdf;base64,${selectedDocument.cv || selectedDocument.lettre}`}
                            title={selectedDocument.cv ? 'CV' : 'Lettre de motivation'}
                            className="flex-1 w-full bg-white dark:bg-slate-800"
                            style={{ border: "none" }}
                        />
                    </div>
                </div>
            )}

            {/* Modal de visualisation PDF (pour les évaluations uniquement) */}
            {pdfUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
                        {/* En-tête du modal */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{pdfTitle}</h2>
                            <button
                                onClick={closePdfViewer}
                                className="cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                            </button>
                        </div>
                        {/* Iframe pour afficher le PDF */}
                        <iframe
                            src={pdfUrl}
                            title={pdfTitle}
                            className="flex-1 w-full bg-white dark:bg-slate-800"
                            style={{ border: "none" }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoriqueEmployeur;

