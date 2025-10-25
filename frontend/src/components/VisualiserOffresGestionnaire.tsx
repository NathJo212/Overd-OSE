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
    ArrowLeft,
    GraduationCap
} from "lucide-react";
import { gestionnaireService, type OffreDTO } from "../services/GestionnaireService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

type FilterType = 'all' | 'expired' | 'refused' | 'approved' | 'pending';

const VisualiserOffresGestionnaire = () => {
    const { t } = useTranslation(["visualiserOffresGestionnaire"]);
    const { t: tProgrammes } = useTranslation('programmes');
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
            console.debug('VisualiserOffres - fetched offres:', data);
            setAllOffres(data);
            setFilteredOffres(data);
        } catch (e: any) {
            setError(e?.message || 'Erreur inconnue');
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

        let filtered: OffreDTO[];

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

    const getStatusBadge = (offre: OffreDTO) => {
        const today = new Date();
        const isExpired = !!offre.dateLimite && new Date(offre.dateLimite) < today;

        if (offre.statutApprouve === "REFUSE") {
            return (
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {t("filters.refused")}
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

        if (offre.statutApprouve === "ATTENTE") {
            return (
                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t("filters.pending")}
                </span>
            );
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

    const programmeLabels: Record<string, string> = {
        P180_A0: "180.A0 Soins infirmiers",
        P180_B0: "180.B0 Soins infirmiers pour auxiliaires",
        P200_B1: "200.B1 Sciences de la nature",
        P200_Z1: "200.Z1 Baccalauréat international en Sciences de la nature Option Sciences de la santé",
        P221_A0: "221.A0 Technologie de l’architecture",
        P221_B0: "221.B0 Technologie du génie civil",
        P221_D0: "221.D0 Technologie de l’estimation et de l’évaluation en bâtiment",
        P243_D0: "243.D0 Technologie du génie électrique: automatisation et contrôle",
        P244_A0: "244.A0 Technologie du génie physique",
        P300_A1_ADMIN: "300.A1 Sciences humaines – profil Administration et économie",
        P300_A1_MATH: "300.A1 Sciences humaines – profil avec mathématiques",
        P300_A1_RELATIONS: "300.A1 Sciences humaines – profil Individu et relations humaines",
        P300_A1_MONDE: "300.A1 Sciences humaines – profil Monde en action",
        P322_A1: "322.A1 Techniques d’éducation à l’enfance",
        P388_A1: "388.A1 Techniques de travail social",
        P410_A1: "410.A1 Gestion des opérations et de la chaîne logistique",
        P410_G0: "410.G0 Techniques d’administration et de gestion (TAG)",
        P420_B0: "420.B0 Techniques de l’informatique",
        P500_AF: "500.AF Photographie et design graphique",
        P500_AG: "500.AG Cinéma",
        P500_AJ: "500.AJ Journalisme multimédia",
        P500_AL: "500.AL Langues – profil Trilinguisme et cultures"
    };

    const formatProgEtude = (prog: any) => {
        if (!prog) return 'Non spécifié';
        if (typeof prog === 'string') {
            // prefer i18n mapping for programme keys, fallback to our labels or raw key
            try {
                const translated = tProgrammes(prog);
                // tProgrammes returns the key if missing, so check
                if (translated && translated !== prog) return translated;
            } catch (e) {
                // ignore
            }
            return programmeLabels[prog] || prog;
        }
        if (typeof prog === 'object') {
            if (prog.label) return prog.label;
            if (prog.name) {
                try {
                    const translated = tProgrammes(prog.name);
                    if (translated && translated !== prog.name) return translated;
                } catch (e) {}
                return programmeLabels[prog.name] || prog.name;
            }
            if (prog.nom) return prog.nom;
            if (prog.nameFr) return prog.nameFr;
            return JSON.stringify(prog);
        }
        return String(prog);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="w-full flex justify-start mb-6">
                    <button
                        onClick={() => navigate('/dashboard-etudiant')}
                        className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{t("back")}</span>
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
                    <p className="text-gray-600">{t("subtitle")}</p>
                </div>

                <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-gray-900">{t("textFilter")}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => filterOffres('all')}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {t("filters.all")} ({allOffres.length})
                        </button>
                        <button
                            onClick={() => filterOffres('pending')}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'pending' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                        >
                            {t("filters.pending")} ({allOffres.filter(o => o.statutApprouve === 'ATTENTE').length})
                        </button>
                        <button
                            onClick={() => filterOffres('approved')}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'approved' ? 'bg-green-600 text-white shadow-lg' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                            {t("filters.approved")} ({allOffres.filter(o => o.statutApprouve === 'APPROUVE').length})
                        </button>
                        <button
                            onClick={() => filterOffres('refused')}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'refused' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        >
                            {t("filters.refused")} ({allOffres.filter(o => o.statutApprouve === 'REFUSE').length})
                        </button>
                        <button
                            onClick={() => filterOffres('expired')}
                            className={`cursor-pointer px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                                currentFilter === 'expired' ? 'bg-gray-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {t("filters.expired")} ({allOffres.filter(o => o.dateLimite && new Date(o.dateLimite) < new Date()).length})
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                    </div>
                )}

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
                            {currentFilter === 'all' ? t("noOffers") : t("noOffersFiltered", { status: t("status." + currentFilter) })}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {filteredOffres.map(offre => (
                            <div key={offre.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200">
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 pr-4">{offre.titre}</h2>
                                    {getStatusBadge(offre)}
                                </div>

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

                                <div className="mb-4">
                                    <p className="text-gray-700 text-sm leading-relaxed">{offre.description}</p>
                                </div>

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

                                {/* Programme d'étude (placed with dates) */}
                                <div className="mb-4 flex items-center gap-3 text-sm">
                                    <GraduationCap className="w-4 h-4 text-slate-600" />
                                    <div>
                                        <span className="ml-2 font-medium text-gray-800">
                                            {typeof offre.progEtude === 'string' ? tProgrammes(offre.progEtude) : formatProgEtude(offre.progEtude)}
                                        </span>
                                    </div>
                                </div>

                                {offre.dateLimite && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <span className="text-blue-800"><strong>{t("endDateApplication")}</strong> {formatDate(offre.dateLimite)}</span>
                                        </div>
                                    </div>
                                )}

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
