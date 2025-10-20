import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Search,
    Briefcase,
    RefreshCw,
    ArrowLeft,
    Building2,
    Calendar,
} from 'lucide-react';
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

interface CandidatureEtudiant {
    id: number;
    offreId: number;
    offreTitre: string;
    entrepriseNom: string;
    dateCandidature: string;
    statut: string;
    messageReponse?: string;
}

const CandidaturesEtudiant = () => {
    const { t } = useTranslation(["candidaturesetudiant"]);
    const navigate = useNavigate();
    const params = useParams<{ etudiantId?: string }>();
    const etudiantId = params?.etudiantId;

    const [candidatures, setCandidatures] = useState<CandidatureEtudiant[]>([]);
    const [filteredCandidatures, setFilteredCandidatures] = useState<CandidatureEtudiant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "ETUDIANT") {
            navigate("/login");
            return;
        }

        loadCandidatures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    useEffect(() => {
        filterCandidatures();
    }, [searchTerm, statusFilter, candidatures]);

    useEffect(() => {
        // if route param changes, reload
        loadCandidatures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [etudiantId]);

    const loadCandidatures = async () => {
        setLoading(true);
        setError("");

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                setLoading(false);
                return;
            }

            const endpoint = etudiantId
                ? `http://localhost:8080/OSEetudiant/candidatures/etudiant/${etudiantId}`
                : `http://localhost:8080/OSEetudiant/candidatures`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                // token probably expired or unauthorized
                setError(t('errors.notAuthenticated') || 'Not authenticated');
                // clear session so UX matches backend auth state
                // do not auto-clear if you prefer to keep session; adjust as needed
                // sessionStorage.clear();
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            setCandidatures(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || t('errors.loading'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterCandidatures = () => {
        let filtered = [...candidatures];

        if (statusFilter !== "ALL") {
            filtered = filtered.filter(c => c.statut === statusFilter);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                (c.offreTitre || '').toLowerCase().includes(term) ||
                (c.entrepriseNom || '').toLowerCase().includes(term)
            );
        }

        setFilteredCandidatures(filtered);
    };

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case "EN_ATTENTE":
            case "PENDING":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        {t('status.pending')}
                    </span>
                );
            case "ACCEPTEE":
            case "ACCEPTED":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('status.accepted')}
                    </span>
                );
            case "REFUSEE":
            case "REFUSED":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        {t('status.refused')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {statut}
                    </span>
                );
        }
    };

    const getStatusCount = (statut: string) => {
        if (statut === "ALL") return candidatures.length;
        return candidatures.filter(c => c.statut === statut).length;
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <NavBar />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-lg text-gray-600">{t('loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/dashboard-etudiant")}
                        className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {t('backToDashboard')}
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-400 mr-3" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('search')}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Filter className="inline w-4 h-4 mr-1" />
                                {t('filterByStatus')}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">{t('filters.all')} ({getStatusCount("ALL")})</option>
                                <option value="EN_ATTENTE">{t('filters.pending')} ({getStatusCount("EN_ATTENTE")})</option>
                                <option value="ACCEPTEE">{t('filters.accepted')} ({getStatusCount("ACCEPTEE")})</option>
                                <option value="REFUSEE">{t('filters.refused')} ({getStatusCount("REFUSEE")})</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.total')}</p>
                                <p className="text-2xl font-bold text-gray-900">{getStatusCount("ALL")}</p>
                            </div>
                            <Briefcase className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.pending')}</p>
                                <p className="text-2xl font-bold text-yellow-600">{getStatusCount("EN_ATTENTE")}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.accepted')}</p>
                                <p className="text-2xl font-bold text-green-600">{getStatusCount("ACCEPTEE")}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{t('stats.refused')}</p>
                                <p className="text-2xl font-bold text-red-600">{getStatusCount("REFUSEE")}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Candidatures List */}
                {filteredCandidatures.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('noCandidatures.title')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || statusFilter !== "ALL"
                                ? t('noCandidatures.noResults')
                                : t('noCandidatures.neverApplied')}
                        </p>
                        {!searchTerm && statusFilter === "ALL" && (
                            <button
                                onClick={() => navigate("/dashboard-etudiant")}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Briefcase className="w-5 h-5 mr-2" />
                                {t('noCandidatures.viewOffers')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCandidatures.map((candidature) => (
                            <div
                                key={candidature.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {candidature.offreTitre}
                                        </h3>
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <Building2 className="w-4 h-4 mr-2" />
                                            {candidature.entrepriseNom}
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {t('appliedOn')} {formatDate(candidature.dateCandidature)}
                                        </div>
                                    </div>
                                    <div>
                                        {getStatusBadge(candidature.statut)}
                                    </div>
                                </div>

                                {candidature.messageReponse && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">{t('employerMessage')}</p>
                                        <p className="text-sm text-gray-600">{candidature.messageReponse}</p>
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

export default CandidaturesEtudiant;
