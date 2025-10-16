import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeurService } from "../services/EmployeurService";
import {
    Users, Calendar, Mail, FileText, CheckCircle, XCircle, Clock,
    Download, Filter, Search, Briefcase, RefreshCw
} from 'lucide-react';
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

interface CandidatureRecue {
    id: number;
    offreId: number;
    offreTitre: string;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantEmail: string;
    dateCandidature: string;
    statut: string;
    aCv: boolean;
    aLettreMotivation: boolean;
    messageReponse?: string;
}

const CandidaturesRecues = () => {
    const { t } = useTranslation(["candidaturesrecues"]);
    const navigate = useNavigate();
    const [candidatures, setCandidatures] = useState<CandidatureRecue[]>([]);
    const [filteredCandidatures, setFilteredCandidatures] = useState<CandidatureRecue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [offreFilter, setOffreFilter] = useState<string>("ALL");

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }

        loadCandidatures().then();
    }, [navigate]);

    useEffect(() => {
        filterCandidatures();
    }, [searchTerm, statusFilter, offreFilter, candidatures]);

    const loadCandidatures = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await employeurService.getCandidaturesRecues();
            setCandidatures(data);
        } catch (err) {
            setError(t("candidaturesrecues:errors.loadCandidatures"));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterCandidatures = () => {
        let filtered = [...candidatures];

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.etudiantNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.etudiantPrenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.etudiantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.offreTitre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "ALL") {
            filtered = filtered.filter(c => c.statut === statusFilter);
        }

        if (offreFilter !== "ALL") {
            filtered = filtered.filter(c => c.offreTitre === offreFilter);
        }

        setFilteredCandidatures(filtered);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatutBadge = (statut: string) => {
        const configs = {
            'EN_ATTENTE': {
                icon: Clock,
                text: t("candidaturesrecues:status.pending"),
                className: "bg-amber-50 text-amber-700 border-amber-200"
            },
            'ACCEPTEE': {
                icon: CheckCircle,
                text: t("candidaturesrecues:status.accepted"),
                className: "bg-emerald-50 text-emerald-700 border-emerald-200"
            },
            'REFUSEE': {
                icon: XCircle,
                text: t("candidaturesrecues:status.refused"),
                className: "bg-rose-50 text-rose-700 border-rose-200"
            }
        };

        const config = configs[statut as keyof typeof configs] || {
            icon: Clock,
            text: statut,
            className: "bg-gray-50 text-gray-700 border-gray-200"
        };

        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.className}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.text}
            </span>
        );
    };

    const getStatistics = () => {
        const total = candidatures.length;
        const enAttente = candidatures.filter(c => c.statut === 'EN_ATTENTE').length;
        const acceptees = candidatures.filter(c => c.statut === 'ACCEPTEE').length;
        const refusees = candidatures.filter(c => c.statut === 'REFUSEE').length;

        return { total, enAttente, acceptees, refusees };
    };

    const getUniqueOffres = () => {
        const offres = Array.from(new Set(candidatures.map(c => c.offreTitre)));
        return offres.sort();
    };

    const handleTelechargerCV = async (candidatureId: number) => {
        try {
            const blob = await employeurService.telechargerCvCandidature(candidatureId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cv-candidature-${candidatureId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur téléchargement CV:', error);
            setError(t("candidaturesrecues:errors.downloadCV"));
        }
    };

    const handleTelechargerLettreMotivation = async (candidatureId: number) => {
        try {
            const blob = await employeurService.telechargerLettreMotivationCandidature(candidatureId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lettre-motivation-candidature-${candidatureId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur téléchargement lettre:', error);
            setError(t("candidaturesrecues:errors.downloadLetter"));
        }
    };

    const stats = getStatistics();
    const offresUniques = getUniqueOffres();

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gray-50 py-8 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">{t("candidaturesrecues:loading")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {t("candidaturesrecues:title")}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    {t("candidaturesrecues:subtitle")}
                                </p>
                            </div>
                            <button
                                onClick={loadCandidatures}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Actualiser"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {t("candidaturesrecues:stats.total")}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {t("candidaturesrecues:stats.pending")}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.enAttente}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {t("candidaturesrecues:stats.accepted")}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.acceptees}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {t("candidaturesrecues:stats.refused")}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.refusees}</p>
                                </div>
                                <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-rose-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                                <p className="text-sm text-rose-800 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder={t("candidaturesrecues:searchPlaceholder")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="ALL">{t("candidaturesrecues:filters.all")}</option>
                                    <option value="EN_ATTENTE">{t("candidaturesrecues:filters.pending")}</option>
                                    <option value="ACCEPTEE">{t("candidaturesrecues:filters.accepted")}</option>
                                    <option value="REFUSEE">{t("candidaturesrecues:filters.refused")}</option>
                                </select>

                                <select
                                    value={offreFilter}
                                    onChange={(e) => setOffreFilter(e.target.value)}
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="ALL">{t("candidaturesrecues:filters.allOffers")}</option>
                                    {offresUniques.map(offre => (
                                        <option key={offre} value={offre}>{offre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(searchTerm || statusFilter !== "ALL" || offreFilter !== "ALL") && (
                            <div className="mt-4 flex items-center gap-2 text-sm">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">
                                    <span className="font-medium text-gray-900">{filteredCandidatures.length}</span> {t("candidaturesrecues:resultsFound")}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Candidatures List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        {filteredCandidatures.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {searchTerm || statusFilter !== "ALL" || offreFilter !== "ALL"
                                        ? t("candidaturesrecues:noResults.title")
                                        : t("candidaturesrecues:noCandidatures.title")
                                    }
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {searchTerm || statusFilter !== "ALL" || offreFilter !== "ALL"
                                        ? t("candidaturesrecues:noResults.subtitle")
                                        : t("candidaturesrecues:noCandidatures.subtitle")
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredCandidatures.map((candidature) => (
                                    <div
                                        key={candidature.id}
                                        className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                            <div className="flex-1 space-y-3">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {candidature.etudiantPrenom} {candidature.etudiantNom}
                                                        </h3>
                                                        <p className="text-sm text-blue-600 font-medium mt-1 flex items-center gap-1.5">
                                                            <FileText className="w-4 h-4" />
                                                            {candidature.offreTitre}
                                                        </p>
                                                    </div>
                                                    {getStatutBadge(candidature.statut)}
                                                </div>

                                                {/* Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{candidature.etudiantEmail}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {formatDate(candidature.dateCandidature)}
                                                    </div>
                                                </div>

                                                {/* Documents */}
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                                                        candidature.aCv
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                        <FileText className="w-3.5 h-3.5" />
                                                        CV {candidature.aCv ? '✓' : '✗'}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                                                        candidature.aLettreMotivation
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {t("candidaturesrecues:coverLetter")} {candidature.aLettreMotivation ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-row lg:flex-col gap-2">
                                                {candidature.aCv && (
                                                    <button
                                                        onClick={() => handleTelechargerCV(candidature.id)}
                                                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        CV
                                                    </button>
                                                )}
                                                {candidature.aLettreMotivation && (
                                                    <button
                                                        onClick={() => handleTelechargerLettreMotivation(candidature.id)}
                                                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Lettre
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CandidaturesRecues;