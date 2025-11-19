import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import AnneeAcademiqueSelector from './AnneeAcademiqueSelector';
import { employeurService } from '../services/EmployeurService';
import { History, FileText, Users, BookOpen, Award, ArrowLeft } from 'lucide-react';

type OngletType = 'candidatures' | 'ententes' | 'evaluations';

const HistoriqueEmployeur = () => {
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletType>('candidatures');
    const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');
    const [candidatures, setCandidatures] = useState<any[]>([]);
    const [ententes, setEntentes] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
                                                <div key={evaluation.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-slate-700">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-100">
                                                                Évaluation - {evaluation.etudiantNom}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                                Date: {new Date(evaluation.dateEvaluation).toLocaleDateString('fr-CA')}
                                                            </p>
                                                        </div>
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

export default HistoriqueEmployeur;

