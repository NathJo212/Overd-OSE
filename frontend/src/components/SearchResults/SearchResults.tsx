import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, Building2, GraduationCap, UserCog, Search as SearchIcon, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import NavBar from "../NavBar.tsx";
import searchService from "../../services/UtilisateurService.ts";

type UserCategory = "ALL" | "ETUDIANT" | "EMPLOYEUR" | "PROFESSEUR" | "GESTIONNAIRE";

interface SearchResult {
    id: number;
    type: "ETUDIANT" | "EMPLOYEUR" | "PROFESSEUR" | "GESTIONNAIRE";
    nom?: string;
    prenom?: string;
    email: string;
    telephone?: string;
    nomEntreprise?: string;
    contact?: string;
    progEtude?: string;
}

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation('searchresult');
    const query = searchParams.get("q") || "";
    const userRole = sessionStorage.getItem('userType');

    const [searchTerm, setSearchTerm] = useState(query);
    const [category, setCategory] = useState<UserCategory>("ALL");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Determine which categories to show based on user role
    const getAvailableCategories = () => {
        if (userRole === 'ETUDIANT') {
            return ['ALL', 'EMPLOYEUR', 'PROFESSEUR', 'GESTIONNAIRE'];
        }
        return ['ALL', 'ETUDIANT', 'EMPLOYEUR', 'PROFESSEUR', 'GESTIONNAIRE'];
    };

    const availableCategories = getAvailableCategories();

    const performSearch = async (term: string, cat: UserCategory) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const data = await searchService.searchUsers(term, cat);
            let allResults: SearchResult[] = [];

            // Backend already handles ETUDIANT filtering, but keep frontend logic for safety
            if (data.etudiants) {
                allResults = [...allResults, ...data.etudiants.map((e: any) => ({ ...e, type: "ETUDIANT" as const }))];
            }
            if (data.employeurs) {
                allResults = [...allResults, ...data.employeurs.map((e: any) => ({ ...e, type: "EMPLOYEUR" as const }))];
            }
            if (data.professeurs) {
                allResults = [...allResults, ...data.professeurs.map((p: any) => ({ ...p, type: "PROFESSEUR" as const }))];
            }
            if (data.gestionnaires) {
                allResults = [...allResults, ...data.gestionnaires.map((g: any) => ({ ...g, type: "GESTIONNAIRE" as const }))];
            }

            setResults(allResults);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (query) {
            performSearch(query, category);
        }
    }, [query]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            performSearch(searchTerm.trim(), category);
        }
    };

    const handleCategoryChange = (newCategory: UserCategory) => {
        setCategory(newCategory);
        if (searchTerm.trim()) {
            performSearch(searchTerm.trim(), newCategory);
        }
    };

    const getUserIcon = (type: string) => {
        switch (type) {
            case "ETUDIANT":
                return <Users className="w-5 h-5 text-indigo-600" />;
            case "EMPLOYEUR":
                return <Building2 className="w-5 h-5 text-blue-600" />;
            case "PROFESSEUR":
                return <GraduationCap className="w-5 h-5 text-purple-600" />;
            case "GESTIONNAIRE":
                return <UserCog className="w-5 h-5 text-green-600" />;
            default:
                return <User className="w-5 h-5 text-gray-600" />;
        }
    };

    const getUserBadgeColor = (type: string) => {
        switch (type) {
            case "ETUDIANT":
                return "bg-indigo-100 text-indigo-800";
            case "EMPLOYEUR":
                return "bg-blue-100 text-blue-800";
            case "PROFESSEUR":
                return "bg-purple-100 text-purple-800";
            case "GESTIONNAIRE":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getDisplayName = (result: SearchResult) => {
        if (result.type === "EMPLOYEUR") {
            return result.nomEntreprise || result.contact || "Employeur";
        }
        return `${result.prenom || ""} ${result.nom || ""}`.trim() || "Utilisateur";
    };

    // Get translated program name
    const getTranslatedProgram = (progEtude?: string) => {
        if (!progEtude) return null;
        return t(progEtude, { defaultValue: progEtude });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {t('search.title')}
                    </h1>

                    <form onSubmit={handleSearchSubmit} className="mb-6">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search.placeholder')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            <button
                                type="submit"
                                className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                {t('search.button')}
                            </button>
                        </div>
                    </form>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => handleCategoryChange("ALL")}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium transition-all ${
                                category === "ALL"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                        >
                            {t('search.categories.all')}
                        </button>
                        {availableCategories.includes('ETUDIANT') && (
                            <button
                                onClick={() => handleCategoryChange("ETUDIANT")}
                                className={`cursor-pointer px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                    category === "ETUDIANT"
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                {t('search.categories.students')}
                            </button>
                        )}
                        <button
                            onClick={() => handleCategoryChange("EMPLOYEUR")}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                category === "EMPLOYEUR"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                        >
                            <Building2 className="w-4 h-4" />
                            {t('search.categories.employers')}
                        </button>
                        <button
                            onClick={() => handleCategoryChange("PROFESSEUR")}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                category === "PROFESSEUR"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                        >
                            <GraduationCap className="w-4 h-4" />
                            {t('search.categories.professors')}
                        </button>
                        <button
                            onClick={() => handleCategoryChange("GESTIONNAIRE")}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                category === "GESTIONNAIRE"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                        >
                            <UserCog className="w-4 h-4" />
                            {t('search.categories.managers')}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-4">{t('search.searching')}</p>
                    </div>
                ) : !hasSearched ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">{t('search.performSearch')}</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">{t('search.noResults')}</p>
                        <p className="text-gray-500 text-sm mt-2">{t('search.tryDifferent')}</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 mb-4">
                            {t('search.resultsCount', { count: results.length })}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((result) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:shadow-blue-100 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${
                                                result.type === "ETUDIANT" ? "bg-indigo-50" :
                                                    result.type === "EMPLOYEUR" ? "bg-blue-50" :
                                                        result.type === "PROFESSEUR" ? "bg-purple-50" :
                                                            "bg-green-50"
                                            }`}>
                                                {getUserIcon(result.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1">
                                                    {getDisplayName(result)}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserBadgeColor(result.type)}`}>
                                                    {t(`search.types.${result.type.toLowerCase()}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="truncate">{result.email}</p>
                                        {result.telephone && (
                                            <p className="truncate">{result.telephone}</p>
                                        )}
                                        {result.type === "EMPLOYEUR" && result.contact && (
                                            <p className="truncate">{t('search.contact')}: {result.contact}</p>
                                        )}
                                        {result.type === "ETUDIANT" && result.progEtude && (
                                            <p className="truncate">{t('search.program')}: {getTranslatedProgram(result.progEtude)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchResults;