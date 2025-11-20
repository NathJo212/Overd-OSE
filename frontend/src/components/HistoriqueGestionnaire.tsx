import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { gestionnaireService } from '../services/GestionnaireService';
import { History, Briefcase, BookOpen, Building2, Mail, Phone, MapPin, Calendar, DollarSign, GraduationCap, AlertCircle, CheckCircle, XCircle, Filter, ArrowLeft, X, User, Clock, FileSignature } from 'lucide-react';

type OngletType = 'offres' | 'ententes';
type FilterType = 'all' | 'pending' | 'approved' | 'refused' | 'expired';
type EntenteFilterType = 'all' | 'waiting' | 'signed' | 'refused';

const HistoriqueGestionnaire = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('offres');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [allOffres, setAllOffres] = useState<any[]>([]);
    const [filteredOffres, setFilteredOffres] = useState<any[]>([]);
    const [allEntentes, setAllEntentes] = useState<any[]>([]);
    const [filteredEntentes, setFilteredEntentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
    const [currentEntenteFilter, setCurrentEntenteFilter] = useState<EntenteFilterType>('all');
    
    // États pour le modal de détails des ententes
    const [selectedEntente, setSelectedEntente] = useState<any | null>(null);
    const [showEntenteModal, setShowEntenteModal] = useState(false);

    useEffect(() => {
        const role = sessionStorage.getItem('userType');
        if (role !== 'GESTIONNAIRE') {
            navigate('/login');
            return;
        }
        
        loadData();
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [anneeSelectionnee]);

    useEffect(() => {
        // Appliquer le filtre quand les offres changent
        filterOffres(currentFilter);
    }, [allOffres]);

    useEffect(() => {
        // Appliquer le filtre quand les ententes changent
        filterEntentes(currentEntenteFilter);
    }, [allEntentes]);

    const loadData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');
        if (!token) return;

        try {
            const [offresData, entData] = await Promise.all([
                gestionnaireService.getOffresAvecFiltre(token, anneeSelectionnee),
                gestionnaireService.getEntentesAvecFiltre(token, anneeSelectionnee),
            ]);

            setAllOffres(offresData || []);
            setFilteredOffres(offresData || []);
            setAllEntentes(entData || []);
            setFilteredEntentes(entData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnneeChange = (annee: string) => {
        setAnneeSelectionnee(annee);
    };

    const filterEntentes = (filterType: EntenteFilterType) => {
        setCurrentEntenteFilter(filterType);
        let filtered = [...allEntentes];

        switch (filterType) {
            case 'waiting':
                // Ententes en attente d'au moins une signature
                filtered = filtered.filter(e => 
                    e.etudiantSignature === 'EN_ATTENTE' || 
                    e.employeurSignature === 'EN_ATTENTE' || 
                    e.gestionnaireSignature === 'EN_ATTENTE'
                );
                break;
            case 'signed':
                // Ententes complètement signées (toutes les 3 signatures)
                filtered = filtered.filter(e => 
                    e.etudiantSignature === 'SIGNEE' && 
                    e.employeurSignature === 'SIGNEE' && 
                    e.gestionnaireSignature === 'SIGNEE'
                );
                break;
            case 'refused':
                // Ententes refusées par au moins une partie
                filtered = filtered.filter(e => 
                    e.etudiantSignature === 'REFUSEE' || 
                    e.employeurSignature === 'REFUSEE' || 
                    e.gestionnaireSignature === 'REFUSEE'
                );
                break;
            case 'all':
            default:
                // Toutes les ententes
                break;
        }

        setFilteredEntentes(filtered);
    };

    const filterOffres = (filterType: FilterType) => {
        setCurrentFilter(filterType);
        const today = new Date();

        let filtered: any[];

        switch (filterType) {
            case 'expired':
                filtered = allOffres.filter(offre =>
                    !!offre.dateLimite && new Date(offre.dateLimite) < today
                );
                break;
            case 'refused':
                filtered = allOffres.filter(offre =>
                    offre.statutApprouve === 'REFUSE'
                );
                break;
            case 'approved':
                filtered = allOffres.filter(offre =>
                    offre.statutApprouve === 'APPROUVE'
                );
                break;
            case 'pending':
                filtered = allOffres.filter(offre =>
                    offre.statutApprouve === 'ATTENTE'
                );
                break;
            default:
                filtered = allOffres;
        }

        setFilteredOffres(filtered);
    };

    const getStatusBadge = (offre: any) => {
        const today = new Date();
        const isExpired = !!offre.dateLimite && new Date(offre.dateLimite) < today;

        if (offre.statutApprouve === "REFUSE") {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    Refusée
                </span>
            );
        }

        if (offre.statutApprouve === "APPROUVE") {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Approuvée
                </span>
            );
        }

        if (isExpired) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Expirée
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                En attente
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-CA');
    };

    const getStatutBadgeClass = (statut: string) => {
        const statusMap: { [key: string]: string } = {
            'ATTENTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            'EN_ATTENTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            'APPROUVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            'REFUSE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
            'ACCEPTEE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            'REFUSEE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
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
                        onClick={() => navigate('/dashboard-gestionnaire')}
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Historique - Gestionnaire</h1>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300">
                        Consultez toutes les offres, ententes et candidatures par année académique
                    </p>
                </div>

                {/* Sélecteur d'année */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 border border-transparent dark:border-slate-700">
                    {/* Le gestionnaire peut voir TOUTES les années */}
                    <AnneeAcademiqueSelector 
                        onAnneeChange={handleAnneeChange}
                        includeToutes={true}
                    />
                </div>

                {/* Onglets */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-transparent dark:border-slate-700">
                    <div className="border-b border-gray-200 dark:border-slate-700">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setOngletActif('offres')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'offres'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <Briefcase size={20} />
                                Offres ({allOffres.length})
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
                                Ententes ({allEntentes.length})
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
                                {/* Onglet Offres avec filtres */}
                                {ongletActif === 'offres' && (
                                    <>
                                        {/* Filtres pour les offres */}
                                        <div className="mb-6 bg-gray-50 dark:bg-slate-700/40 rounded-xl p-4 border border-transparent dark:border-slate-600">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Filter className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Filtrer par statut</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={() => filterOffres('all')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentFilter === 'all'
                                                            ? 'bg-blue-600 text-white shadow-lg'
                                                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600'
                                                    }`}
                                                >
                                                    Toutes ({allOffres.length})
                                                </button>
                                                <button
                                                    onClick={() => filterOffres('pending')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentFilter === 'pending'
                                                            ? 'bg-yellow-500 text-white shadow-lg'
                                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                                                    }`}
                                                >
                                                    En attente ({allOffres.filter(o => o.statutApprouve === 'ATTENTE').length})
                                                </button>
                                                <button
                                                    onClick={() => filterOffres('approved')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentFilter === 'approved'
                                                            ? 'bg-green-600 text-white shadow-lg'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                                    }`}
                                                >
                                                    Approuvées ({allOffres.filter(o => o.statutApprouve === 'APPROUVE').length})
                                                </button>
                                                <button
                                                    onClick={() => filterOffres('refused')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentFilter === 'refused'
                                                            ? 'bg-red-600 text-white shadow-lg'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                                    }`}
                                                >
                                                    Refusées ({allOffres.filter(o => o.statutApprouve === 'REFUSE').length})
                                                </button>
                                                <button
                                                    onClick={() => filterOffres('expired')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentFilter === 'expired'
                                                            ? 'bg-gray-600 text-white shadow-lg'
                                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                                                    }`}
                                                >
                                                    Expirées ({allOffres.filter(o => o.dateLimite && new Date(o.dateLimite) < new Date()).length})
                                                </button>
                                            </div>
                                        </div>

                                        {/* Grille d'offres */}
                                        {filteredOffres.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <Briefcase size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune offre pour cette période</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-6 md:grid-cols-2">
                                                {filteredOffres.map((offre) => (
                                                    <div key={offre.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200 dark:border-slate-700">
                                                        {/* En-tête de la carte */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 pr-4">{offre.titre}</h2>
                                                            {getStatusBadge(offre)}
                                                        </div>

                                                        {/* Info employeur */}
                                                        <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-200 dark:border-slate-600">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Building2 className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                                                                <span className="font-semibold text-gray-900 dark:text-slate-100">
                                                                    {offre.employeurDTO?.nomEntreprise || 'Entreprise non spécifiée'}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1 text-sm text-gray-600 dark:text-slate-300">
                                                                {offre.employeurDTO?.email && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                                                        <span className="text-xs">{offre.employeurDTO.email}</span>
                                                                    </div>
                                                                )}
                                                                {offre.employeurDTO?.telephone && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Phone className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                                                        <span className="text-xs">{offre.employeurDTO.telephone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Description */}
                                                        <div className="mb-4">
                                                            <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
                                                                {offre.description}
                                                            </p>
                                                        </div>

                                                        {/* Détails */}
                                                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-slate-400">Début: </span>
                                                                    <span className="font-medium text-gray-800 dark:text-slate-100">
                                                                        {formatDate(offre.date_debut)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-slate-400">Fin: </span>
                                                                    <span className="font-medium text-gray-800 dark:text-slate-100">
                                                                        {formatDate(offre.date_fin)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {offre.lieuStage && (
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                                    <span className="text-gray-700 dark:text-slate-300">{offre.lieuStage}</span>
                                                                </div>
                                                            )}
                                                            {offre.remuneration && (
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                                    <span className="text-gray-700 dark:text-slate-300">{offre.remuneration}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Programme */}
                                                        {offre.progEtude && (
                                                            <div className="mb-4 flex items-center gap-3 text-sm">
                                                                <GraduationCap className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                                                                <span className="font-medium text-gray-800 dark:text-slate-100">{offre.progEtude}</span>
                                                            </div>
                                                        )}

                                                        {/* Date limite */}
                                                        {offre.dateLimite && (
                                                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-900/40">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                                    <span className="text-blue-800 dark:text-blue-200">
                                                                        <strong>Date limite: </strong>{formatDate(offre.dateLimite)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Message de refus */}
                                                        {offre.messageRefus && (
                                                            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-900/40">
                                                                <div className="flex items-start gap-2 text-sm">
                                                                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-red-800 dark:text-red-200 font-medium mb-1">Raison du refus:</p>
                                                                        <p className="text-red-700 dark:text-red-300">{offre.messageRefus}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Onglet Ententes */}
                                {ongletActif === 'ententes' && (
                                    <>
                                        {/* Filtres pour les ententes */}
                                        <div className="mb-6 bg-gray-50 dark:bg-slate-700/40 rounded-xl p-4 border border-transparent dark:border-slate-600">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Filter className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Filtrer par statut de signature</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={() => filterEntentes('all')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentEntenteFilter === 'all'
                                                            ? 'bg-blue-600 text-white shadow-lg'
                                                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600'
                                                    }`}
                                                >
                                                    Toutes ({allEntentes.length})
                                                </button>
                                                <button
                                                    onClick={() => filterEntentes('waiting')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentEntenteFilter === 'waiting'
                                                            ? 'bg-yellow-500 text-white shadow-lg'
                                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                                                    }`}
                                                >
                                                    En attente ({allEntentes.filter(e => 
                                                        e.etudiantSignature === 'EN_ATTENTE' || 
                                                        e.employeurSignature === 'EN_ATTENTE' || 
                                                        e.gestionnaireSignature === 'EN_ATTENTE'
                                                    ).length})
                                                </button>
                                                <button
                                                    onClick={() => filterEntentes('signed')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentEntenteFilter === 'signed'
                                                            ? 'bg-green-600 text-white shadow-lg'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                                    }`}
                                                >
                                                    Signées ({allEntentes.filter(e => 
                                                        e.etudiantSignature === 'SIGNEE' && 
                                                        e.employeurSignature === 'SIGNEE' && 
                                                        e.gestionnaireSignature === 'SIGNEE'
                                                    ).length})
                                                </button>
                                                <button
                                                    onClick={() => filterEntentes('refused')}
                                                    className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                                        currentEntenteFilter === 'refused'
                                                            ? 'bg-red-600 text-white shadow-lg'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                                    }`}
                                                >
                                                    Refusées ({allEntentes.filter(e => 
                                                        e.etudiantSignature === 'REFUSEE' || 
                                                        e.employeurSignature === 'REFUSEE' || 
                                                        e.gestionnaireSignature === 'REFUSEE'
                                                    ).length})
                                                </button>
                                            </div>
                                        </div>

                                        {filteredEntentes.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune entente ne correspond à ce filtre</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {filteredEntentes.map((entente) => (
                                                    <div
                                                        key={entente.id}
                                                        onClick={() => handleEntenteClick(entente)}
                                                        className="bg-white dark:bg-slate-700 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400/40 dark:hover:shadow-blue-900/40 transition-all duration-300 p-6 border border-slate-200 dark:border-slate-600 cursor-pointer group"
                                                    >
                                                        {/* Badge et date */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            {getSignatureStatusBadge(entente.statut)}
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
                                                                        {entente.etudiantNomComplet || entente.etudiantNom || 'Étudiant'}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
                                                                        {entente.etudiantEmail || 'Email non disponible'}
                                                                    </p>
                                                                </div>
                                                            </div>
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
                                                                <Calendar className="w-3 h-3 flex-shrink-0" />
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
                                    </>
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
                                        <h4 className="font-semibold text-gray-900 dark:text-slate-100">Statut de l'entente</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getSignatureStatusBadge(selectedEntente.statut)}
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
                                        <span className="font-medium">Nom:</span> {selectedEntente.etudiantNomComplet || selectedEntente.etudiantNom || 'Non disponible'}
                                    </p>
                                    <p className="text-gray-800 dark:text-slate-200">
                                        <span className="font-medium">Email:</span> {selectedEntente.etudiantEmail || 'Non disponible'}
                                    </p>
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

export default HistoriqueGestionnaire;
