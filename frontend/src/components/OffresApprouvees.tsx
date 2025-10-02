import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import etudiantService from "../services/EtudiantService";
import utilisateurService from "../services/UtilisateurService";
import type { OffreDTO } from "../services/EtudiantService";

const OffresApprouvees = () => {
    const [offres, setOffres] = useState<OffreDTO[]>([]);
    const [offresFiltered, setOffresFiltered] = useState<OffreDTO[]>([]);
    const [programmes, setProgrammes] = useState<{[key: string]: string}>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtres et tri
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProgramme, setSelectedProgramme] = useState<string>("TOUS");
    const [sortBy, setSortBy] = useState<string>("date");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        chargerDonnees();
    }, []);

    useEffect(() => {
        appliquerFiltresEtTri();
    }, [offres, searchTerm, selectedProgramme, sortBy]);

    const chargerDonnees = async () => {
        try {
            setLoading(true);
            setError(null);

            // Charger les offres et les programmes en parallèle
            const [offresData, programmesData] = await Promise.all([
                etudiantService.getOffresApprouvees(),
                utilisateurService.getAllProgrammes()
            ]);

            setOffres(offresData);
            setProgrammes(programmesData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const appliquerFiltresEtTri = () => {
        let resultat = [...offres];

        // Filtre par recherche (titre, description, entreprise)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            resultat = resultat.filter(offre =>
                offre.titre.toLowerCase().includes(term) ||
                offre.description.toLowerCase().includes(term) ||
                offre.employeurDTO.nomEntreprise.toLowerCase().includes(term) ||
                offre.lieuStage.toLowerCase().includes(term)
            );
        }

        // Filtre par programme
        if (selectedProgramme !== "TOUS") {
            resultat = resultat.filter(offre => offre.progEtude === selectedProgramme);
        }

        // Tri
        resultat.sort((a, b) => {
            switch (sortBy) {
                case "titre":
                    return a.titre.localeCompare(b.titre);
                case "entreprise":
                    return a.employeurDTO.nomEntreprise.localeCompare(b.employeurDTO.nomEntreprise);
                case "remuneration":
                    const remuA = etudiantService.extractRemunerationValue(a.remuneration);
                    const remuB = etudiantService.extractRemunerationValue(b.remuneration);
                    return remuB - remuA; // Décroissant
                case "dateLimite":
                    return new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime();
                case "date":
                default:
                    return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
            }
        });

        setOffresFiltered(resultat);
    };

    const getProgrammeLabel = (key: string): string => {
        return programmes[key] || key;
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
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête avec barre de recherche */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Barre de recherche */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Rechercher par titre, entreprise, lieu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Bouton Filtres */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                        Filtres
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Panneau de filtres */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Filtre par programme */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Programme d'études
                            </label>
                            <select
                                value={selectedProgramme}
                                onChange={(e) => setSelectedProgramme(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="TOUS">Tous les programmes</option>
                                {Object.entries(programmes).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tri */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trier par
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="date">Date de publication (récent)</option>
                                <option value="titre">Titre (A-Z)</option>
                                <option value="entreprise">Entreprise (A-Z)</option>
                                <option value="remuneration">Rémunération (décroissant)</option>
                                <option value="dateLimite">Date limite</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Compteur de résultats */}
                <div className="mt-4 text-sm text-gray-600">
                    {offresFiltered.length} offre{offresFiltered.length > 1 ? 's' : ''} trouvée{offresFiltered.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Liste des offres */}
            {offresFiltered.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">Aucune offre ne correspond à vos critères</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {offresFiltered.map((offre) => (
                        <div
                            key={offre.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                {/* Colonne gauche - Informations principales */}
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

                                    {/* Tags d'information */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                            {getProgrammeLabel(offre.progEtude)}
                                        </span>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                            📍 {offre.lieuStage}
                                        </span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                            💰 {offre.remuneration}
                                        </span>
                                    </div>
                                </div>

                                {/* Colonne droite - Dates et action */}
                                <div className="lg:w-64 flex flex-col gap-3">
                                    <div className="text-sm">
                                        <p className="text-gray-600">
                                            <span className="font-medium">Période:</span> {offre.date_debut} → {offre.date_fin}
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            <span className="font-medium">Date limite:</span> {offre.dateLimite}
                                        </p>
                                    </div>
                                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                        Postuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OffresApprouvees;