import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { gestionnaireService } from '../services/GestionnaireService';
import { History, Briefcase, BookOpen, Users, Building2, Mail, Phone, MapPin, Calendar, DollarSign, GraduationCap, AlertCircle, CheckCircle, XCircle, Filter, ArrowLeft } from 'lucide-react';

type OngletType = 'offres' | 'ententes' | 'candidatures';
type FilterType = 'all' | 'pending' | 'approved' | 'refused' | 'expired';

const HistoriqueGestionnaire = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('offres');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [allOffres, setAllOffres] = useState<any[]>([]);
    const [filteredOffres, setFilteredOffres] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

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

    const loadData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');
        if (!token) return;

        try {
            const [offresData, entData, candData] = await Promise.all([
                gestionnaireService.getOffresAvecFiltre(token, anneeSelectionnee),
                gestionnaireService.getEntentesAvecFiltre(token, anneeSelectionnee),
                gestionnaireService.getCandidaturesEligiblesAvecFiltre(token, anneeSelectionnee),
            ]);

            setAllOffres(offresData || []);
            setFilteredOffres(offresData || []);
            setEntentes(entData || []);
            setCandidatures(candData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnneeChange = (annee: string) => {
        setAnneeSelectionnee(annee);
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
            'ATTENTE': 'bg-yellow-100 text-yellow-800',
            'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
            'APPROUVE': 'bg-green-100 text-green-800',
            'REFUSE': 'bg-red-100 text-red-800',
            'ACCEPTEE': 'bg-green-100 text-green-800',
            'REFUSEE': 'bg-red-100 text-red-800',
            'SIGNEE': 'bg-green-100 text-green-800',
        };
        return statusMap[statut] || 'bg-gray-100 text-gray-800';
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
                                Ententes ({ententes.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('candidatures')}
                                className={`cursor-pointer flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'candidatures'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <Users size={20} />
                                Candidatures Confirmées ({candidatures.length})
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
                                    <div className="space-y-4">
                                        {ententes.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune entente pour cette période</p>
                                            </div>
                                        ) : (
                                            ententes.map((entente) => (
                                                <div key={entente.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-slate-700">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-100">
                                                                {entente.titre}
                                                            </h3>
                                                            <p className="text-gray-600 dark:text-slate-300 mt-1">
                                                                Étudiant: {entente.etudiantNom}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-slate-300 mt-1">
                                                                Employeur: {entente.employeurNomEntreprise}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                                Période: {new Date(entente.dateDebut).toLocaleDateString('fr-CA')} - {new Date(entente.dateFin).toLocaleDateString('fr-CA')}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadgeClass(entente.statut)}`}>
                                                            {entente.statut}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Onglet Candidatures Confirmées */}
                                {ongletActif === 'candidatures' && (
                                    <div className="space-y-4">
                                        {candidatures.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                                <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                                <p>Aucune candidature confirmée pour cette période</p>
                                                <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
                                                    (Candidatures approuvées par l'employeur ET acceptées par l'étudiant)
                                                </p>
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
                                                                Étudiant: {cand.etudiantPrenom} {cand.etudiantNom}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                                Date: {new Date(cand.dateCandidature).toLocaleDateString('fr-CA')}
                                                            </p>
                                                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-full text-xs">
                                                                <CheckCircle size={14} />
                                                                Confirmée des deux côtés
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadgeClass(cand.statut)}`}>
                                                            {cand.statut}
                                                        </span>
                                                    </div>
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
        </div>
    );
};

export default HistoriqueGestionnaire;
