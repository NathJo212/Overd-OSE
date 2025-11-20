import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { employeurService } from '../services/EmployeurService';
import { History, FileText, Users, BookOpen, Award, ArrowLeft, Eye, User, Briefcase, MapPin, Calendar as CalendarIcon, X, Clock, DollarSign, CheckCircle, FileSignature } from 'lucide-react';

type OngletType = 'candidatures' | 'ententes' | 'evaluations';

const HistoriqueEmployeur = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('candidatures');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // États pour la visionneuse PDF des évaluations
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>('');
    
    // États pour le modal de détails des ententes
    const [selectedEntente, setSelectedEntente] = useState<any | null>(null);
    const [showEntenteModal, setShowEntenteModal] = useState(false);

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
            setEntentes(entData || []);
            setEvaluations(evalData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnneeChange = (annee: string) => {
        setAnneeSelectionnee(annee);
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

    // Visualiser le PDF d'une évaluation dans le modal
    const handleViewPdfEvaluation = async (evaluationId: number, etudiantNom: string) => {
        try {
            const blob = await employeurService.getPdfEvaluation(evaluationId);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(`Évaluation de ${etudiantNom}`);
        } catch (error) {
            console.error('Erreur lors du chargement du PDF:', error);
            alert('Erreur lors du chargement du PDF de l\'évaluation');
        }
    };

    // Fermer le modal PDF et révoquer l'URL
    const closePdfViewer = () => {
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
        setPdfTitle('');
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
                        Vous avez signé
                    </span>
                );
            case 'EN_ATTENTE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                    </span>
                );
            case 'REFUSEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">
                        <X className="w-3 h-3 mr-1" />
                        Refusée
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
                        <span className="font-medium">Retour au tableau de bord</span>
                    </button>
                </div>

                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <History size={32} className="text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Historique</h1>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300">
                        Consultez vos candidatures, ententes et évaluations par année académique
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
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'candidatures'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <Users size={20} />
                                Candidatures ({candidatures.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('ententes')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'ententes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <BookOpen size={20} />
                                Ententes ({ententes.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('evaluations')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'evaluations'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <Award size={20} />
                                Évaluations ({evaluations.length})
                            </button>
                        </nav>
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600 dark:text-slate-300">Chargement...</p>
                            </div>
                        ) : (
                            <>
                                {/* Onglet Candidatures */}
                                {ongletActif === 'candidatures' && (
                                    <div className="space-y-4">
                                        {candidatures.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune candidature pour cette période</p>
                                            </div>
                                        ) : (
                                            candidatures.map((cand) => (
                                                <div key={cand.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-slate-700">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-100">
                                                                {cand.offreTitre}
                                                            </h3>
                                                            <p className="text-gray-600 dark:text-slate-300 mt-1">
                                                                {cand.etudiantPrenom} {cand.etudiantNom}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                                Date: {new Date(cand.dateCandidature).toLocaleDateString('fr-CA')}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadgeClass(cand.statut)}`}>
                                                            {cand.statut.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Onglet Ententes */}
                                {ongletActif === 'ententes' && (
                                    <div>
                                        {ententes.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune entente pour cette période</p>
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
                                                                        {entente.etudiantNomComplet || `${entente.etudiantPrenom || ''} ${entente.etudiantNom || ''}`.trim() || 'Étudiant'}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
                                                                        {entente.etudiantEmail || 'Email non disponible'}
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
                                                                <span>{entente.dureeHebdomadaire || 'N/A'} h/semaine</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                                                                <DollarSign className="w-3 h-3 flex-shrink-0" />
                                                                <span>{entente.remuneration || 'Non spécifiée'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Indicateur hover */}
                                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center gap-2">
                                                                Voir les détails
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
                                    <div className="space-y-4">
                                        {evaluations.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <Award size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune évaluation pour cette période</p>
                                            </div>
                                        ) : (
                                            evaluations.map((evaluation) => (
                                                <div key={evaluation.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition bg-white dark:bg-slate-700">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Award className="w-6 h-6 text-green-600" />
                                                                <h3 className="font-bold text-xl text-gray-900 dark:text-slate-100">
                                                                    Évaluation de stagiaire
                                                                </h3>
                                                            </div>
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                                                <Eye size={14} />
                                                                Évaluation soumise
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Informations du stagiaire */}
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User className="w-5 h-5 text-blue-600" />
                                                            <h4 className="font-semibold text-gray-900 dark:text-slate-100">Stagiaire évalué</h4>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-slate-300 font-medium">
                                                            {evaluation.etudiantPrenom} {evaluation.etudiantNom}
                                                        </p>
                                                        {evaluation.etudiantEmail && (
                                                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                                                {evaluation.etudiantEmail}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Informations du stage */}
                                                    {evaluation.offreTitre && (
                                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Briefcase className="w-5 h-5 text-purple-600" />
                                                                <h4 className="font-semibold text-gray-900 dark:text-slate-100">Stage</h4>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-slate-300 font-medium">
                                                                {evaluation.offreTitre}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Date d'évaluation */}
                                                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-slate-400">
                                                        <CalendarIcon className="w-4 h-4" />
                                                        <span>Évaluée le {new Date(evaluation.dateEvaluation).toLocaleDateString('fr-CA', { 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}</span>
                                                    </div>

                                                    {/* Bouton voir PDF */}
                                                    <button
                                                        onClick={() => handleViewPdfEvaluation(evaluation.id, `${evaluation.etudiantPrenom || ''} ${evaluation.etudiantNom || 'Stagiaire'}`)}
                                                        className="cursor-pointer w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={20} />
                                                        Voir l'évaluation (PDF)
                                                    </button>
                                                </div>
                                            ))
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
                                            Entente de stage
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
                                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">Statut de signature</h4>
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
                                    Étudiant
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">Nom:</span> {selectedEntente.etudiantNomComplet || `${selectedEntente.etudiantPrenom || ''} ${selectedEntente.etudiantNom || ''}`.trim() || 'Non disponible'}
                                    </p>
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">Email:</span> {selectedEntente.etudiantEmail || 'Non disponible'}
                                    </p>
                                </div>
                            </div>

                            {/* Informations du stage */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    Informations du stage
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Date de début</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateDebut}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Date de fin</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dateFin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Horaire</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.horaire || 'Non spécifié'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Heures par semaine</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.dureeHebdomadaire || 'N/A'} h/semaine</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Programme</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.progEtude || 'Non spécifié'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Lieu</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.lieuStage || selectedEntente.lieu || 'Non défini'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Rémunération</p>
                                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedEntente.remuneration || 'Non spécifiée'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedEntente.description && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                                        Description
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
                                Fermer
                            </button>
                        </div>
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

