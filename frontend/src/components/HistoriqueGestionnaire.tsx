import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { gestionnaireService } from '../services/GestionnaireService';
import { History, Briefcase, BookOpen, Users } from 'lucide-react';

type OngletType = 'offres' | 'ententes' | 'candidatures';

const HistoriqueGestionnaire = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('offres');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [offres, setOffres] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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

            setOffres(offresData || []);
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
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <History size={32} className="text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Historique - Gestionnaire</h1>
                    </div>
                    <p className="text-gray-600">
                        Consultez toutes les offres, ententes et candidatures par année académique
                    </p>
                </div>

                {/* Sélecteur d'année */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    {/* Le gestionnaire peut voir TOUTES les années */}
                    <AnneeAcademiqueSelector 
                        onAnneeChange={handleAnneeChange}
                        includeToutes={true}
                    />
                </div>

                {/* Onglets */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setOngletActif('offres')}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'offres'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Briefcase size={20} />
                                Offres ({offres.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('ententes')}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'ententes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <BookOpen size={20} />
                                Ententes ({ententes.length})
                            </button>
                            <button
                                onClick={() => setOngletActif('candidatures')}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'candidatures'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Users size={20} />
                                Candidatures Éligibles ({candidatures.length})
                            </button>
                        </nav>
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Chargement...</p>
                            </div>
                        ) : (
                            <>
                                {/* Onglet Offres */}
                                {ongletActif === 'offres' && (
                                    <div className="space-y-4">
                                        {offres.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
                                                <p>Aucune offre pour cette période</p>
                                            </div>
                                        ) : (
                                            offres.map((offre) => (
                                                <div key={offre.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-gray-900">
                                                                {offre.titre}
                                                            </h3>
                                                            <p className="text-gray-600 mt-1">
                                                                Employeur: {offre.employeurDTO?.nomEntreprise}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Lieu: {offre.lieuStage}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Période: {new Date(offre.date_debut).toLocaleDateString('fr-CA')} - {new Date(offre.date_fin).toLocaleDateString('fr-CA')}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadgeClass(offre.statutApprouve)}`}>
                                                            {offre.statutApprouve}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Onglet Ententes */}
                                {ongletActif === 'ententes' && (
                                    <div className="space-y-4">
                                        {ententes.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                                                <p>Aucune entente pour cette période</p>
                                            </div>
                                        ) : (
                                            ententes.map((entente) => (
                                                <div key={entente.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-gray-900">
                                                                {entente.titre}
                                                            </h3>
                                                            <p className="text-gray-600 mt-1">
                                                                Étudiant: {entente.etudiantNom}
                                                            </p>
                                                            <p className="text-gray-600 mt-1">
                                                                Employeur: {entente.employeurNomEntreprise}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
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

                                {/* Onglet Candidatures */}
                                {ongletActif === 'candidatures' && (
                                    <div className="space-y-4">
                                        {candidatures.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                                <p>Aucune candidature éligible pour cette période</p>
                                            </div>
                                        ) : (
                                            candidatures.map((cand) => (
                                                <div key={cand.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-gray-900">
                                                                {cand.offreTitre}
                                                            </h3>
                                                            <p className="text-gray-600 mt-1">
                                                                Étudiant: {cand.etudiantPrenom} {cand.etudiantNom}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Date: {new Date(cand.dateCandidature).toLocaleDateString('fr-CA')}
                                                            </p>
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

