import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeurService } from "../services/EmployeurService";
import {
    Users,
    Calendar,
    Mail,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Search,
    Briefcase,
    RefreshCw,
    X,
    Eye,
    ArrowLeft,
} from 'lucide-react';
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";
import * as React from "react";

interface CandidatureRecue {
    id: number;
    offreId: number;
    offreTitre: string;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantEmail: string;
    dateCandidature: string;
    statut: string;
    acv: boolean;
    alettreMotivation: boolean;
    messageReponse?: string;
    convocation?: {
        id: number;
        dateHeure: string;
        lieuOuLien: string;
        message: string;
        statut: 'CONVOQUEE' | 'MODIFIE' | 'ANNULEE';
    };
}

interface DocumentPreview {
    prenom: string;
    nom: string;
    cv?: string;
    lettre?: string;
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
    const [selectedCandidature, setSelectedCandidature] = useState<CandidatureRecue | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentPreview | null>(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    // Load notifications from localStorage on mount
    const [convocationError, setConvocationError] = useState<string | null>(() => {
        return localStorage.getItem('convocationError') || null;
    });
    const [convocationSuccess, setConvocationSuccess] = useState<string | null>(() => {
        return localStorage.getItem('convocationSuccess') || null;
    });
    const [creatingConvocationId, setCreatingConvocationId] = useState<number | null>(null);

    // Modal state for convocation creation
    const [showConvocationModal, setShowConvocationModal] = useState(false);
    const [convocationFormData, setConvocationFormData] = useState({
        dateEntrevue: '',
        heureDebut: '',
        lieu: '',
        message: ''
    });

    // Effect to persist notifications in localStorage
    useEffect(() => {
        if (convocationError) {
            localStorage.setItem('convocationError', convocationError);
        } else {
            localStorage.removeItem('convocationError');
        }
    }, [convocationError]);

    useEffect(() => {
        if (convocationSuccess) {
            localStorage.setItem('convocationSuccess', convocationSuccess);
        } else {
            localStorage.removeItem('convocationSuccess');
        }
    }, [convocationSuccess]);

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }

        loadCandidatures();
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

    // Badge pour le statut d'une convocation (employeur <-> étudiant)
    const getConvocationStatusBadge = (statut?: 'CONVOQUEE' | 'MODIFIE' | 'ANNULEE') => {
        if (!statut) return null;
        switch (statut) {
            case 'CONVOQUEE':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('candidaturesrecues:convocationStatus.convoked')}
                    </span>
                );
            case 'MODIFIE':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <Clock className="w-3.5 h-3.5" />
                        {t('candidaturesrecues:convocationStatus.modified')}
                    </span>
                );
            case 'ANNULEE':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3.5 h-3.5" />
                        {t('candidaturesrecues:convocationStatus.cancelled')}
                    </span>
                );
            default:
                return null;
        }
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

    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1] || '';
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const handleRegarderCV = async (candidatureId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const blob = await employeurService.telechargerCvCandidature(candidatureId);
            const base64 = await blobToBase64(blob);

            setSelectedDocument({
                prenom: selectedCandidature?.etudiantPrenom ?? '',
                nom: selectedCandidature?.etudiantNom ?? '',
                cv: base64
            });
            setShowDocumentModal(true);
        } catch (err) {
            console.error('Erreur affichage CV :', err);
            setError(t("candidaturesrecues:errors.downloadCV"));
        }
    };

    const handleRegarderLettreMotivation = async (candidatureId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const blob = await employeurService.telechargerLettreMotivationCandidature(candidatureId);
            const base64 = await blobToBase64(blob);

            setSelectedDocument({
                prenom: selectedCandidature?.etudiantPrenom ?? '',
                nom: selectedCandidature?.etudiantNom ?? '',
                lettre: base64
            });
            setShowDocumentModal(true);
        } catch (err) {
            console.error('Erreur affichage lettre :', err);
            setError(t("candidaturesrecues:errors.downloadLetter"));
        }
    };

    const closeDocumentModal = () => {
        setShowDocumentModal(false);
        setSelectedDocument(null);
    };

    const handleOpenModal = (candidature: CandidatureRecue) => {
        setSelectedCandidature(candidature);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCandidature(null);
    };

    const handleCreerConvocation = async (candidature: CandidatureRecue, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setConvocationError(null);
        setConvocationSuccess(null);
        setSelectedCandidature(candidature);

        // Pre-fill default values
        const date = new Date();
        date.setDate(date.getDate() + 7);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = '10:00';

        setConvocationFormData({
            dateEntrevue: dateStr,
            heureDebut: timeStr,
            lieu: 'À confirmer',
            message: `Convocation pour ${candidature.etudiantPrenom} ${candidature.etudiantNom} - Offre: ${candidature.offreTitre}`
        });

        setShowConvocationModal(true);
    };

    const handleConvocationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConvocationFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitConvocation = async () => {
        if (!selectedCandidature) return;

        setConvocationError(null);
        setConvocationSuccess(null);
        setCreatingConvocationId(selectedCandidature.id);

        try {
            console.log('=== Début de la création de convocation ===');
            console.log('Candidature sélectionnée:', selectedCandidature);
            console.log('ID de la candidature:', selectedCandidature.id);

            // Validate form
            if (!convocationFormData.dateEntrevue || !convocationFormData.heureDebut || !convocationFormData.lieu.trim()) {
                setConvocationError(t("candidaturesrecues:errors.fillRequiredFields"));
                setCreatingConvocationId(null);
                return;
            }

             // Build ISO datetime
             const dateTime = new Date(`${convocationFormData.dateEntrevue}T${convocationFormData.heureDebut}:00`);
             const dateHeure = dateTime.toISOString();

             console.log('Date construite:', dateHeure);

             const payload = {
                 dateHeure,
                 lieuOuLien: convocationFormData.lieu,
                message: convocationFormData.message || t('candidaturesrecues:placeholders.messageTemplate', { prenom: selectedCandidature.etudiantPrenom, offre: selectedCandidature.offreTitre })
             };

             console.log('Payload à envoyer:', payload);
             console.log('Appel de creerConvocation avec candidatureId:', selectedCandidature.id);

             await employeurService.creerConvocation(selectedCandidature.id, payload);
            setConvocationSuccess(t('candidaturesrecues:messages.convocationCreated'));
             setShowConvocationModal(false);
             // Refresh candidatures to reflect convocation if backend returns it
             await loadCandidatures();
         } catch (err: any) {
            console.error('Erreur créer convocation:', err);
            const msg = err?.message || null;
            setConvocationError(msg || t('candidaturesrecues:errors.createConvocation'));
         } finally {
             setCreatingConvocationId(null);
         }
     };

    const handleCloseConvocationModal = () => {
        setShowConvocationModal(false);
        setSelectedCandidature(null);
        setConvocationFormData({
            dateEntrevue: '',
            heureDebut: '',
            lieu: '',
            message: ''
        });
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
        <div>
            <NavBar />
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Bouton retour */}
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{t('candidaturesrecues:backToDashboard')}</span>
                    </button>

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
                                title={t("candidaturesrecues:labels.refresh")}
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

                    {/* Convocation Success Message */}
                    {convocationSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <p className="text-sm text-emerald-800 font-medium">{convocationSuccess}</p>
                                </div>
                                <button
                                    onClick={() => setConvocationSuccess(null)}
                                    className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded transition-colors"
                                    aria-label="Fermer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Convocation Error Message */}
                    {convocationError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                                    <p className="text-sm text-rose-800 font-medium">{convocationError}</p>
                                </div>
                                <button
                                    onClick={() => setConvocationError(null)}
                                    className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded transition-colors"
                                    aria-label="Fermer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
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
                                        onClick={() => handleOpenModal(candidature)}
                                        className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
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
                                                    <div className="flex flex-col items-end gap-2">
                                                        {getStatutBadge(candidature.statut)}
                                                        {candidature.convocation?.statut && (
                                                            <div className="mt-1">{getConvocationStatusBadge(candidature.convocation.statut)}</div>
                                                        )}
                                                    </div>
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
                                                        candidature.acv
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                        <FileText className="w-3.5 h-3.5" />
                                                        CV {candidature.acv ? '✓' : '✗'}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                                                        candidature.alettreMotivation
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {t("candidaturesrecues:coverLetter")} {candidature.alettreMotivation ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-row lg:flex-col gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenModal(candidature);
                                                    }}
                                                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {t("candidaturesrecues:viewDetails")}
                                                </button>

                                                {/* Create convocation button */}
                                                {!candidature.convocation && (
                                                    <button
                                                        onClick={(e) => handleCreerConvocation(candidature, e)}
                                                        disabled={creatingConvocationId === candidature.id}
                                                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        {creatingConvocationId === candidature.id ? t('candidaturesrecues:creating') : t('candidaturesrecues:createConvocation')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {showModal && selectedCandidature && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                {/* Header Modal */}
                                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedCandidature.etudiantPrenom} {selectedCandidature.etudiantNom}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">{t("candidaturesrecues:labels.applicationNumber")}{selectedCandidature.id}</p>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Contenu Modal */}
                                <div className="p-6 space-y-6">
                                    {/* Statut */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.status")}</label>
                                        {getStatutBadge(selectedCandidature.statut)}
                                    </div>

                                    {/* Offre */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.internshipOffer")}</label>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <span className="text-blue-900 font-medium">{selectedCandidature.offreTitre}</span>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.contact")}</label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-gray-700">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                                <span>{selectedCandidature.etudiantEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-700">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                                <span>{t("candidaturesrecues:labels.appliedOn")} {formatDate(selectedCandidature.dateCandidature)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-3">{t("candidaturesrecues:labels.documents")}</label>
                                        <div className="space-y-3">
                                            {selectedCandidature.acv && (
                                                <button
                                                    onClick={(e) => handleRegarderCV(selectedCandidature.id, e)}
                                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-medium text-gray-900">{t("candidaturesrecues:documentCards.cvTitle")}</p>
                                                            <p className="text-sm text-gray-500">{t("candidaturesrecues:documentCards.cvSubtitle")}</p>
                                                        </div>
                                                    </div>
                                                    <Eye className="w-5 h-5 text-gray-400" />
                                                </button>
                                            )}

                                            {selectedCandidature.alettreMotivation && (
                                                <button
                                                    onClick={(e) => handleRegarderLettreMotivation(selectedCandidature.id, e)}
                                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-medium text-gray-900">{t("candidaturesrecues:documentCards.letterTitle")}</p>
                                                            <p className="text-sm text-gray-500">{t("candidaturesrecues:documentCards.letterSubtitle")}</p>
                                                        </div>
                                                    </div>
                                                    <Eye className="w-5 h-5 text-gray-400" />
                                                </button>
                                            )}

                                            {!selectedCandidature.acv && !selectedCandidature.alettreMotivation && (
                                                <p className="text-sm text-gray-500 text-center py-4">{t("candidaturesrecues:documentCards.noDocument")}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message de réponse si existe */}
                                    {selectedCandidature.messageReponse && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.message")}</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <p className="text-gray-700">{selectedCandidature.messageReponse}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Convocation section in modal */}
                                    {selectedCandidature.convocation && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-2">{t('candidaturesrecues:labels.convocation')}</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-700"><strong>{t('candidaturesrecues:convocation.date')}</strong> {formatDate(selectedCandidature.convocation.dateHeure)}</p>
                                                        <p className="text-sm text-gray-700 mt-1"><strong>{t('candidaturesrecues:convocation.location')}</strong> {selectedCandidature.convocation.lieuOuLien}</p>
                                                        <p className="text-sm text-gray-700 mt-2">{selectedCandidature.convocation.message}</p>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {getConvocationStatusBadge(selectedCandidature.convocation.statut)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Modal */}
                                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        {t("candidaturesrecues:labels.close")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showDocumentModal && selectedDocument && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                            <h3 className="text-xl font-semibold">
                                {selectedDocument.cv ? t("candidaturesrecues:documentCards.cvTitle") : t("candidaturesrecues:documentCards.letterTitle")} - {selectedDocument.prenom} {selectedDocument.nom}
                            </h3>
                            <button onClick={closeDocumentModal} className="text-white hover:text-gray-200" aria-label={t("candidaturesrecues:modal.close")}>
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                            {selectedDocument.cv || selectedDocument.lettre ? (
                                <iframe
                                    src={`data:application/pdf;base64,${selectedDocument.cv ?? selectedDocument.lettre}`}
                                    className="w-full h-[600px] border rounded"
                                    title={t("candidaturesrecues:modal.title")}
                                    allow="fullscreen"
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">{t("candidaturesrecues:modal.noPreview")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showConvocationModal && selectedCandidature && !selectedCandidature.convocation && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header Modal */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {t("candidaturesrecues:createConvocation")}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">{t("candidaturesrecues:for")} {selectedCandidature.etudiantPrenom} {selectedCandidature.etudiantNom}</p>
                            </div>
                            <button
                                onClick={handleCloseConvocationModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Contenu Modal */}
                        <div className="p-6 space-y-6">
                            {/* Formulaire de convocation */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.dateHeure")}</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        name="dateEntrevue"
                                        value={convocationFormData.dateEntrevue}
                                        onChange={handleConvocationFormChange}
                                        placeholder="ex: 25/10/2025"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                    <input
                                        type="time"
                                        name="heureDebut"
                                        value={convocationFormData.heureDebut}
                                        onChange={handleConvocationFormChange}
                                        placeholder="10:00"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.lieu")}</label>
                                <input
                                    type="text"
                                    name="lieu"
                                    value={convocationFormData.lieu}
                                    onChange={handleConvocationFormChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder={t('candidaturesrecues:placeholders.lieu')}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">{t("candidaturesrecues:labels.message")}</label>
                                <textarea
                                    name="message"
                                    value={convocationFormData.message}
                                    onChange={handleConvocationFormChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    rows={4}
                                    placeholder={t('candidaturesrecues:placeholders.messageTemplate', { prenom: selectedCandidature.etudiantPrenom, offre: selectedCandidature.offreTitre })}
                                />
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                            <button
                                onClick={handleCloseConvocationModal}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                {t("candidaturesrecues:labels.cancel")}
                            </button>
                            <button
                                onClick={handleSubmitConvocation}
                                disabled={creatingConvocationId !== null}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                            >
                                {creatingConvocationId !== null ? t("candidaturesrecues:creating") : t("candidaturesrecues:create")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    );
};

export default CandidaturesRecues;
