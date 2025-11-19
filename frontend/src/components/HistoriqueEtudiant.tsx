import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { etudiantService } from '../services/EtudiantService';
import { History, FileText, BookOpen } from 'lucide-react';

type OngletType = 'candidatures' | 'ententes';

const HistoriqueEtudiant = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('candidatures');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
            setEntentes(entData || []);
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
            'RETIREE': 'bg-gray-100 text-gray-800',
            'ACCEPTEE_PAR_ETUDIANT': 'bg-blue-100 text-blue-800',
            'REFUSEE_PAR_ETUDIANT': 'bg-red-100 text-red-800',
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
                        <h1 className="text-3xl font-bold text-gray-900">Mon Historique</h1>
                    </div>
                    <p className="text-gray-600">
                        Consultez vos candidatures et ententes par année académique
                    </p>
                </div>

                {/* Sélecteur d'année */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <AnneeAcademiqueSelector 
                        onAnneeChange={handleAnneeChange}
                        includeToutes={false}
                    />
                </div>

                {/* Onglets */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setOngletActif('candidatures')}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                                    ongletActif === 'candidatures'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FileText size={20} />
                                Mes Candidatures ({candidatures.length})
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
                                Mes Ententes ({ententes.length})
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
                                {/* Onglet Candidatures */}
                                {ongletActif === 'candidatures' && (
                                    <div className="space-y-4">
                                        {candidatures.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                                                <p>Aucune candidature pour cette période</p>
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
                                                                Employeur: {cand.employeurNomEntreprise}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Date de candidature: {new Date(cand.dateCandidature).toLocaleDateString('fr-CA')}
                                                            </p>
                                                            {cand.messageReponse && (
                                                                <p className="text-sm text-gray-600 mt-2 italic">
                                                                    Message: {cand.messageReponse}
                                                                </p>
                                                            )}
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
                                                                Employeur: {entente.employeurNomEntreprise}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Période: {new Date(entente.dateDebut).toLocaleDateString('fr-CA')} - {new Date(entente.dateFin).toLocaleDateString('fr-CA')}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Lieu: {entente.lieu}
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoriqueEtudiant;

