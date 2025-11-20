import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { etudiantService } from '../services/EtudiantService';
import { History, FileText, BookOpen, ArrowLeft, User, Briefcase, Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, X, FileSignature, Building2, Search, Filter, XCircle } from 'lucide-react';

type OngletType = 'candidatures' | 'ententes';

const HistoriqueEtudiant = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('candidatures');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [filteredCandidatures, setFilteredCandidatures] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // États pour les filtres de candidatures
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    // États pour le modal de détails des ententes
    const [selectedEntente, setSelectedEntente] = useState<any | null>(null);
    const [showEntenteModal, setShowEntenteModal] = useState(false);

    useEffect(() => {
        const role = sessionStorage.getItem('userType');
        if (role !== 'ETUDIANT') {
            navigate('/login');
            return;
        }
        
        loadData();
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [anneeSelectionnee]);

    useEffect(() => {
        // Appliquer les filtres quand les candidatures ou les filtres changent
        filterCandidatures();
    }, [candidatures, searchTerm, statusFilter]);

    const loadData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');
        if (!token) return;

        try {
            const [candData, entData] = await Promise.all([
                etudiantService.getCandidaturesAvecFiltre(token, anneeSelectionnee),
                etudiantService.getEntentesAvecFiltre(token, anneeSelectionnee),
            ]);

            setCandidatures(candData || []);
            setFilteredCandidatures(candData || []);
            setEntentes(entData || []);
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

        // Filtrer par recherche (titre d'offre ou nom d'entreprise)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                (c.offreTitre && c.offreTitre.toLowerCase().includes(term)) ||
                (c.employeurNomEntreprise && c.employeurNomEntreprise.toLowerCase().includes(term))
            );
        }

        setFilteredCandidatures(filtered);
    };

    const handleAnneeChange = (annee: string) => {
        setAnneeSelectionnee(annee);
    };

    const getStatutBadgeClass = (statut: string) => {
        const statusMap: { [key: string]: string } = {
            'EN_ATTENTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            'ACCEPTEE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            'REFUSEE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
            'RETIREE': 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200',
            'ACCEPTEE_PAR_ETUDIANT': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
            'REFUSEE_PAR_ETUDIANT': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
            'SIGNEE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        };
        return statusMap[statut] || 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
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
                        Signée
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
                        onClick={() => navigate('/dashboard-etudiant')}
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Mon Historique</h1>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300">
                        Consultez vos candidatures et ententes par année académique
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
                                <FileText size={20} />
                                Mes Candidatures ({candidatures.length})
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
                                Mes Ententes ({ententes.length})
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
                                    <div>
                                        {/* Filtres */}
                                        <div className="mb-6 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 border border-gray-200 dark:border-slate-600">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Barre de recherche */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                                        <Search className="inline w-4 h-4 mr-1" />
                                                        Rechercher
                                                    </label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            placeholder="Rechercher par titre ou entreprise..."
                                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Filtre par statut */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                                        <Filter className="inline w-4 h-4 mr-1" />
                                                        Filtrer par statut
                                                    </label>
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                                    >
                                                        <option value="ALL">Toutes les candidatures ({candidatures.length})</option>
                                                        <option value="EN_ATTENTE">En attente ({candidatures.filter(c => c.statut === 'EN_ATTENTE').length})</option>
                                                        <option value="ACCEPTEE">Acceptées par employeur ({candidatures.filter(c => c.statut === 'ACCEPTEE').length})</option>
                                                        <option value="ACCEPTEE_PAR_ETUDIANT">Acceptées par moi ({candidatures.filter(c => c.statut === 'ACCEPTEE_PAR_ETUDIANT').length})</option>
                                                        <option value="REFUSEE">Refusées par employeur ({candidatures.filter(c => c.statut === 'REFUSEE').length})</option>
                                                        <option value="REFUSEE_PAR_ETUDIANT">Refusées par moi ({candidatures.filter(c => c.statut === 'REFUSEE_PAR_ETUDIANT').length})</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Compteur de résultats */}
                                            {(searchTerm || statusFilter !== 'ALL') && (
                                                <div className="mt-4 text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                                                    <Filter className="w-4 h-4" />
                                                    <span>
                                                        <span className="font-semibold text-gray-900 dark:text-slate-100">{filteredCandidatures.length}</span> candidature(s) trouvée(s)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Liste des candidatures */}
                                        {filteredCandidatures.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p className="text-lg font-medium mb-2">
                                                    {searchTerm || statusFilter !== 'ALL' 
                                                        ? 'Aucune candidature ne correspond à vos critères' 
                                                        : 'Aucune candidature pour cette période'}
                                                </p>
                                                <p className="text-sm">
                                                    {searchTerm || statusFilter !== 'ALL'
                                                        ? 'Essayez de modifier vos filtres'
                                                        : 'Vous n\'avez pas encore postulé pour cette année académique'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredCandidatures.map((cand) => (
                                                    <div key={cand.id} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
                                                        {/* En-tête avec titre et badge */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-start gap-3">
                                                                    <Briefcase className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                                                    <div>
                                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1">
                                                                            {cand.offreTitre}
                                                                        </h3>
                                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                                            <Building2 className="w-4 h-4" />
                                                                            <span>{cand.employeurNomEntreprise}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Badge de statut */}
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getStatutBadgeClass(cand.statut)}`}>
                                                                {cand.statut === 'EN_ATTENTE' ? 'En attente' :
                                                                 cand.statut === 'ACCEPTEE' ? 'Acceptée par employeur' :
                                                                 cand.statut === 'ACCEPTEE_PAR_ETUDIANT' ? 'Acceptée par moi' :
                                                                 cand.statut === 'REFUSEE' ? 'Refusée par employeur' :
                                                                 cand.statut === 'REFUSEE_PAR_ETUDIANT' ? 'Refusée par moi' :
                                                                 cand.statut}
                                                            </span>
                                                        </div>

                                                        {/* Informations supplémentaires */}
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-3">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            <span>Candidature soumise le {new Date(cand.dateCandidature).toLocaleDateString('fr-CA', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}</span>
                                                        </div>

                                                        {/* Message de réponse (si présent) */}
                                                        {cand.messageReponse && (
                                                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                                                                    Message de l'employeur :
                                                                </p>
                                                                <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                                                                    "{cand.messageReponse}"
                                                                </p>
                                                            </div>
                                                        )}
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
                                                            {getSignatureStatusBadge(entente.etudiantSignature || entente.statut)}
                                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                                {entente.dateCreation ? new Date(entente.dateCreation).toLocaleDateString('fr-CA') : ''}
                                                            </span>
                                                        </div>

                                                        {/* Employeur */}
                                                        <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-600">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <Building2 className="w-5 h-5 text-purple-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">
                                                                        {entente.employeurNomEntreprise || 'Employeur'}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
                                                                        {entente.employeurEmail || 'Email non disponible'}
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
                                    {getSignatureStatusBadge(selectedEntente.etudiantSignature || selectedEntente.statut)}
                                </div>
                            </div>

                            {/* Informations de l'employeur */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-purple-600" />
                                    Employeur
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">Entreprise:</span> {selectedEntente.employeurNomEntreprise || 'Non disponible'}
                                    </p>
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">Email:</span> {selectedEntente.employeurEmail || 'Non disponible'}
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
        </div>
    );
};

export default HistoriqueEtudiant;

