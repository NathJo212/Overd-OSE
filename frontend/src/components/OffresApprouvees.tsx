import {useEffect, useState} from "react";
import {ArrowUpDown, ChevronDown, Search, SlidersHorizontal, CheckCircle} from "lucide-react";
import {useTranslation} from 'react-i18next';
import etudiantService from "../services/EtudiantService";
import utilisateurService from "../services/UtilisateurService";
import ModalPostuler from "./ModalPostuler";

interface EmployeurDTO {
    id?: number;
    nomEntreprise: string;
    email: string;
    telephone: string;
}

interface OffreDTO {
    id: number;
    titre: string;
    description: string;
    date_debut: string;
    date_fin: string;
    progEtude: string;
    lieuStage: string;
    remuneration: string;
    dateLimite: string;
    messageRefus?: string;
    statutApprouve: string;
    employeurDTO: EmployeurDTO;
}

const OffresApprouvees = () => {
    const { t } = useTranslation('offresStageApprouve');
    const { t: tProgrammes } = useTranslation('programmes');
    const [offres, setOffres] = useState<OffreDTO[]>([]);
    const [offresFiltered, setOffresFiltered] = useState<OffreDTO[]>([]);
    const [programmes, setProgrammes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProgramme, setSelectedProgramme] = useState<string>("TOUS");
    const [sortBy, setSortBy] = useState<string>("datePublication");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [showFilters, setShowFilters] = useState(false);

    // Modal de postulation
    const [showPostulerModal, setShowPostulerModal] = useState(false);
    const [selectedOffre, setSelectedOffre] = useState<OffreDTO | null>(null);

    // Suivre les offres déjà postulées
    const [offresPostulees, setOffresPostulees] = useState<Set<number>>(new Set());

    useEffect(() => {
        chargerDonnees().then();
    }, []);

    useEffect(() => {
        appliquerFiltresEtTri();
    }, [offres, searchTerm, selectedProgramme, sortBy, sortOrder]);

    const chargerDonnees = async () => {
        try {
            setLoading(true);
            setError(null);

            const [offresData, programmesData] = await Promise.all([
                etudiantService.getOffresApprouvees(),
                utilisateurService.getAllProgrammes()
            ]);

            setOffres(offresData);
            setProgrammes(programmesData);

            // Vérifier pour chaque offre si l'étudiant a déjà postulé
            const postuleesSet = new Set<number>();
            for (const offre of offresData) {
                const aPostule = await etudiantService.aPostuleOffre(offre.id);
                if (aPostule) {
                    postuleesSet.add(offre.id);
                }
            }
            setOffresPostulees(postuleesSet);

        } catch (err) {
            if (err instanceof Error) {
                if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
                    setError(t('error.fetchFailed'));
                } else {
                    setError(err.message);
                }
            } else {
                setError(t('error.loading'));
            }
        } finally {
            setLoading(false);
        }
    };

    const extractRemunerationValue = (remuneration: string): number => {
        const match = remuneration.match(/[\d,]+/);
        if (match) {
            return parseFloat(match[0].replace(',', '.'));
        }
        return 0;
    };

    const calculateDuree = (dateDebut: string, dateFin: string): number => {
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        const diffTime = Math.abs(fin.getTime() - debut.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const appliquerFiltresEtTri = () => {
        let resultat = [...offres];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            resultat = resultat.filter(offre => {
                return (
                    offre.titre.toLowerCase().includes(term) ||
                    offre.description.toLowerCase().includes(term) ||
                    offre.employeurDTO.nomEntreprise.toLowerCase().includes(term) ||
                    offre.lieuStage.toLowerCase().includes(term)
                );
            });
        }

        if (selectedProgramme !== "TOUS") {
            resultat = resultat.filter(offre => offre.progEtude === selectedProgramme);
        }

        resultat.sort((a, b) => {
            let comparison: number;

            switch (sortBy) {
                case "titre":
                    comparison = a.titre.localeCompare(b.titre);
                    break;
                case "employeur":
                    comparison = a.employeurDTO.nomEntreprise.localeCompare(b.employeurDTO.nomEntreprise);
                    break;
                case "lieu":
                    comparison = a.lieuStage.localeCompare(b.lieuStage);
                    break;
                case "remuneration":
                    const remuA = extractRemunerationValue(a.remuneration);
                    const remuB = extractRemunerationValue(b.remuneration);
                    comparison = remuA - remuB;
                    break;
                case "dateLimite":
                    comparison = new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime();
                    break;
                case "dateDebut":
                    comparison = new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime();
                    break;
                case "duree":
                    const dureeA = calculateDuree(a.date_debut, a.date_fin);
                    const dureeB = calculateDuree(b.date_debut, b.date_fin);
                    comparison = dureeA - dureeB;
                    break;
                case "datePublication":
                default:
                    comparison = new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
                    break;
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

        setOffresFiltered(resultat);
    };

    const getProgrammeLabel = (key: string): string => {
        return tProgrammes(key);
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    };

    const handlePostulerClick = (offre: OffreDTO) => {
        setSelectedOffre(offre);
        setShowPostulerModal(true);
    };

    const handlePostuler = async (offreId: number, lettreMotivation?: File) => {
        await etudiantService.postulerOffre(offreId, lettreMotivation);
    };

    const handlePostulerSuccess = () => {
        setShowPostulerModal(false);
        if (selectedOffre) {
            setOffresPostulees(prev => new Set(prev).add(selectedOffre.id));
        }
        setSelectedOffre(null);
        setSuccessMessage(t('postuler.success') || 'Candidature soumise avec succès !');
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const handleCloseModal = () => {
        setShowPostulerModal(false);
        setSelectedOffre(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={chargerDonnees}
                    className="cursor-pointer mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    {t('error.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Message de succès */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-green-900">{successMessage}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder={t('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                        {t('filters')}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {t('filterLabels.programme')}
                                </label>
                                <select
                                    value={selectedProgramme}
                                    onChange={(e) => setSelectedProgramme(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-blue-300"
                                >
                                    <option value="TOUS">{t('filterLabels.allProgrammes')}</option>
                                    {programmes.map(key => (
                                        <option key={key} value={key}>
                                            {tProgrammes(key)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {t('filterLabels.sortBy')}
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-blue-300"
                                >
                                    <option value="datePublication">{t('sortOptions.datePublication')}</option>
                                    <option value="dateLimite">{t('sortOptions.dateLimite')}</option>
                                    <option value="employeur">{t('sortOptions.employeur')}</option>
                                    <option value="lieu">{t('sortOptions.lieu')}</option>
                                    <option value="duree">{t('sortOptions.duree')}</option>
                                    <option value="remuneration">{t('sortOptions.remuneration')}</option>
                                    <option value="titre">{t('sortOptions.titre')}</option>
                                    <option value="dateDebut">{t('sortOptions.dateDebut')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {t('filterLabels.order')}
                                </label>
                                <button
                                    onClick={toggleSortOrder}
                                    className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-blue-200 rounded-lg bg-white hover:bg-blue-50 transition-all shadow-sm hover:border-blue-300 font-medium"
                                >
                                    <ArrowUpDown className="h-5 w-5 text-blue-600" />
                                    {t(`sortOrder.${sortOrder}`)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                    {offresFiltered.length} {offresFiltered.length > 1 ? t('results.foundPlural') : t('results.found')}
                </div>
            </div>

            {offresFiltered.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">{t('results.noResults')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {offresFiltered.map((offre) => {
                        const aDejaPostule = offresPostulees.has(offre.id);

                        return (
                            <div
                                key={offre.id}
                                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {offre.titre}
                                        </h3>
                                        <p className="text-blue-600 font-medium mb-3">
                                            {offre.employeurDTO.nomEntreprise}
                                        </p>
                                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                            {offre.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                {getProgrammeLabel(offre.progEtude)}
                                            </span>
                                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                                {offre.lieuStage}
                                            </span>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                {offre.remuneration}
                                            </span>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                                {calculateDuree(offre.date_debut, offre.date_fin)} {t('card.jours')}
                                            </span>
                                            {aDejaPostule && (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {t('card.dejaPostule') || 'Déjà postulé'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:w-64 flex flex-col gap-3">
                                        <div className="text-sm">
                                            <p className="text-gray-600">
                                                <span className="font-medium">{t('card.periode')}</span> {offre.date_debut} → {offre.date_fin}
                                            </p>
                                            <p className="text-gray-600 mt-1">
                                                <span className="font-medium">{t('card.dateLimite')}</span> {offre.dateLimite}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handlePostulerClick(offre)}
                                            disabled={aDejaPostule}
                                            className={`cursor-pointer w-full px-4 py-2 rounded-lg transition-colors font-medium ${
                                                aDejaPostule
                                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            {aDejaPostule ? (t('card.dejaPostule') || 'Déjà postulé') : (t('card.postuler') || 'Postuler')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de postulation */}
            {showPostulerModal && selectedOffre && (
                <ModalPostuler
                    offreId={selectedOffre.id}
                    offreTitre={selectedOffre.titre}
                    onClose={handleCloseModal}
                    onSuccess={handlePostulerSuccess}
                    onPostuler={handlePostuler}
                />
            )}
        </div>
    );
};

export default OffresApprouvees;