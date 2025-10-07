import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    ArrowLeft
} from "lucide-react";
import { gestionnaireService, type OffreDTO } from "../services/GestionnaireService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

type FilterType = 'all' | 'expired' | 'refused' | 'approved' | 'pending';

const VisualiserOffresGestionnaire = () => {
    const { t } = useTranslation(["visualiserOffresGestionnaire"]);
    const navigate = useNavigate();
    const [allOffres, setAllOffres] = useState<OffreDTO[]>([]);
    const [filteredOffres, setFilteredOffres] = useState<OffreDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
    const token = sessionStorage.getItem("authToken") || "";

    const chargerToutesLesOffres = async () => {
        try {
            setLoading(true);
            const data = await gestionnaireService.getAllOffres(token);
            setAllOffres(data);
            setFilteredOffres(data);
        } catch (e: any) {
            setError(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "GESTIONNAIRE") {
            navigate("/login");
            return;
        }
        if (!token) {
            setError("Token d'authentification manquant");
            return;
        }
        chargerToutesLesOffres();
    }, [navigate, token]);

    const filterOffres = (filterType: FilterType) => {
        setCurrentFilter(filterType);
        const today = new Date();

        let filtered: OffreDTO[] = [];

        switch (filterType) {
            case 'expired':
                filtered = allOffres.filter(offre =>
                    offre.dateLimite && new Date(offre.dateLimite) < today
                );
                break;
            case 'refused':
                filtered = allOffres.filter(offre =>
                    offre.messageRefus
                    && (!offre.dateLimite || new Date(offre.dateLimite) >= today)
                    && offre.statutApprouve == "REFUSE");
                break;
            case 'approved':
                filtered = allOffres.filter(offre =>
                    !offre.messageRefus &&
                    (!offre.dateLimite || new Date(offre.dateLimite) >= today)
                    && offre.statutApprouve == "APPROUVE"
                );
                break;
            case 'pending':
                filtered = allOffres.filter(offre =>
                    (!offre.dateLimite || new Date(offre.dateLimite) >= today)
                    && offre.statutApprouve == "ATTENTE");
                break;
            default:
                filtered = allOffres;
        }

        setFilteredOffres(filtered);
    };

    const getStatusBadge = (offre: OffreDTO) => {
        const today = new Date();
        const isExpired = offre.dateLimite && new Date(offre.dateLimite) < today;

        if (offre.messageRefus && offre.statutApprouve == "REFUSE") {
            return (
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {t("filters.all")}
                </span>
            );
        }

        if (isExpired) {
            return (
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t("filters.expired")}
                </span>
            );
        }

        if(offre.statutApprouve == "ATTENTE") {
            return (
                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t("filters.pending")}
                </span>
            )
        }

        return (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t("filters.approved")}
            </span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Non spécifiée';
        return new Date(dateString).toLocaleDateString('fr-CA');
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="w-full flex justify-start mb-6">
                    <button
                        onClick={() => navigate('/dashboard-etudiant')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{t("back")}</span>
                    </button>
                </div>
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t("title")}
                    </h1>
                    <p className="text-gray-600">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Filtres */}
                <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-gray-900">{t("textFilter")}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => filterOffres('all')}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'all'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {t("filters.all")} ({allOffres.length})
                        </button>
                        <button
                            onClick={() => filterOffres('pending')}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'pending'
                                    ? 'bg-yellow-500 text-white shadow-lg'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                        >
                            {t("filters.pending")} ({allOffres.filter(o => o.statutApprouve === 'ATTENTE' && (!o.dateLimite || new Date(o.dateLimite) >= new Date())).length})
                        </button>
                        <button
                            onClick={() => filterOffres('approved')}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'approved'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                            {t("filters.approved")} ({allOffres.filter(o => o.statutApprouve === 'APPROUVE' && (!o.dateLimite || new Date(o.dateLimite) >= new Date())).length})
                        </button>
                        <button
                            onClick={() => filterOffres('refused')}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'refused'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        >
                            {t("filters.refused")} ({allOffres.filter(o => o.statutApprouve === 'REFUSE' && (!o.dateLimite || new Date(o.dateLimite) >= new Date())).length})
                        </button>
                        <button
                            onClick={() => filterOffres('expired')}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'expired'
                                    ? 'bg-gray-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {t("filters.expired")} ({allOffres.filter(o => o.dateLimite && new Date(o.dateLimite) < new Date()).length})
                        </button>
                    </div>
                </div>

                {/* Messages d'erreur */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                    </div>
                )}

                {/* Contenu */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    </div>
                ) : filteredOffres.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {currentFilter === 'all'
                                ? t("noOffers")
                                : t("noOffersFiltered", { status: t("status." + currentFilter) })
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {filteredOffres.map(offre => (
                            <div
                                key={offre.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200"
                            >
                                {/* En-tête de la carte */}
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 pr-4">{offre.titre}</h2>
                                    {getStatusBadge(offre)}
                                </div>

                                {/* Info employeur */}
                                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-4 h-4 text-slate-600" />
                                        <span className="font-semibold text-gray-900">{offre.employeurDTO?.nomEntreprise || 'Entreprise non spécifiée'}</span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {offre.employeurDTO?.contact && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500">Contact:</span>
                                                <span>{offre.employeurDTO.contact}</span>
                                            </div>
                                        )}
                                        {offre.employeurDTO?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-slate-500" />
                                                <span className="text-xs">{offre.employeurDTO.email}</span>
                                            </div>
                                        )}
                                        {offre.employeurDTO?.telephone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-500" />
                                                <span className="text-xs">{offre.employeurDTO.telephone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <p className="text-gray-700 text-sm leading-relaxed">{offre.description}</p>
                                </div>

                                {/* Détails */}
                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        <div>
                                            <span className="text-slate-500">{t("start")}</span>
                                            <span className="ml-1 font-medium">{formatDate(offre.date_debut)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        <div>
                                            <span className="text-slate-500">{t("end")}</span>
                                            <span className="ml-1 font-medium">{formatDate(offre.date_fin)}</span>
                                        </div>
                                    </div>
                                    {offre.lieuStage && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <span className="text-gray-700">{offre.lieuStage}</span>
                                        </div>
                                    )}
                                    {offre.remuneration && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-slate-500" />
                                            <span className="text-gray-700">{offre.remuneration}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Date limite */}
                                {offre.dateLimite && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <span className="text-blue-800">
                                                <strong>{t("endDateApplication")}</strong> {formatDate(offre.dateLimite)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Raison du refus si applicable */}
                                {offre.messageRefus && (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-start gap-2 text-sm">
                                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-800 font-medium mb-1">{t("reasonRefused")}</p>
                                                <p className="text-red-700">{offre.messageRefus}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualiserOffresGestionnaire;
