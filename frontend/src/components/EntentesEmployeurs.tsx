import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileSignature,
    User,
    Calendar,
    Clock,
    DollarSign,
    AlertCircle,
    Briefcase,
    ArrowLeft,
    FileText,
    CheckCircle,
    RefreshCw
} from "lucide-react";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";
import * as React from "react";

interface EntenteEmployeur {
    id: number;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    horaire: string;
    dureeHebdomadaire: number;
    remuneration: string;
    responsabilites: string;
    objectifs: string;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantEmail: string;
    offreTitre: string;
    dateCreation: string;
}

const EntentesEmployeurs = () => {
    const { t } = useTranslation(["ententesemployeurs"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ententes, setEntentes] = useState<EntenteEmployeur[]>([]);
    const [error, setError] = useState("");
    const [selectedEntente, setSelectedEntente] = useState<EntenteEmployeur | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }
        loadEntentes();
    }, [navigate]);

    const loadEntentes = async () => {
        try {
            setLoading(true);
            setError("");
            // TODO: Appeler le service une fois implémenté
            // const token = sessionStorage.getItem("authToken") || "";
            // const data = await employeurService.getMesEntentes(token);
            // setEntentes(data);

            // Pour le moment, données mockées pour le design
            setEntentes([
                {
                    id: 1,
                    titre: "Stage en développement web",
                    description: "Stage de développement d'applications web modernes",
                    dateDebut: "2025-01-15",
                    dateFin: "2025-04-30",
                    horaire: "Lundi à Vendredi, 9h-17h",
                    dureeHebdomadaire: 35,
                    remuneration: "20$/heure",
                    responsabilites: "Développer des interfaces utilisateur, participer aux revues de code, collaborer avec l'équipe",
                    objectifs: "Acquérir de l'expérience en React et TypeScript, apprendre les meilleures pratiques de développement",
                    etudiantNom: "Tremblay",
                    etudiantPrenom: "Marie",
                    etudiantEmail: "marie.tremblay@example.com",
                    offreTitre: "Stage développeur frontend",
                    dateCreation: "2024-12-15"
                },
                {
                    id: 2,
                    titre: "Stage en gestion de projet",
                    description: "Assistance à la gestion de projets informatiques",
                    dateDebut: "2025-02-01",
                    dateFin: "2025-05-15",
                    horaire: "Lundi à Vendredi, 8h30-16h30",
                    dureeHebdomadaire: 40,
                    remuneration: "18$/heure",
                    responsabilites: "Suivre l'avancement des projets, organiser des réunions, documenter les processus",
                    objectifs: "Développer des compétences en gestion de projet agile, utiliser des outils de gestion",
                    etudiantNom: "Gagnon",
                    etudiantPrenom: "Jean",
                    etudiantEmail: "jean.gagnon@example.com",
                    offreTitre: "Stage assistant chef de projet",
                    dateCreation: "2024-12-20"
                }
            ]);
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleEntenteClick = (entente: EntenteEmployeur) => {
        setSelectedEntente(entente);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedEntente(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t("ententesemployeurs:backToDashboard")}
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {t("ententesemployeurs:title")}
                            </h1>
                            <p className="text-gray-600">
                                {t("ententesemployeurs:subtitle")}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadEntentes}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t("ententesemployeurs:refresh")}
                    </button>
                </div>

                {/* Erreur */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                    </div>
                )}

                {/* État de chargement */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    </div>
                ) : ententes.length === 0 ? (
                    /* Message: Aucune entente */
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <FileSignature className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {t("ententesemployeurs:noEntentes.title")}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {t("ententesemployeurs:noEntentes.subtitle")}
                        </p>
                    </div>
                ) : (
                    /* Liste des ententes */
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{ententes.length}</span> {t("ententesemployeurs:ententeCount")}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {ententes.map((entente) => (
                                <div
                                    key={entente.id}
                                    onClick={() => handleEntenteClick(entente)}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-6 border border-slate-200 cursor-pointer group"
                                >
                                    {/* Badge et date */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            {t("ententesemployeurs:active")}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(entente.dateCreation).toLocaleDateString('fr-CA')}
                                        </span>
                                    </div>

                                    {/* Étudiant */}
                                    <div className="mb-4 pb-4 border-b border-slate-200">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 mb-1">
                                                    {entente.etudiantPrenom} {entente.etudiantNom}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {entente.etudiantEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Titre de l'offre */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900 text-sm truncate">
                                                {entente.titre}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-1 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.dateDebut} → {entente.dateFin}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.dureeHebdomadaire}h/{t("ententesemployeurs:week")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <DollarSign className="w-3 h-3 flex-shrink-0" />
                                            <span>{entente.remuneration}</span>
                                        </div>
                                    </div>

                                    {/* Indicateur hover */}
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            {t("ententesemployeurs:viewDetails")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal détails de l'entente */}
            {showModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* En-tête du modal */}
                        <div className="sticky top-0 bg-blue-50 px-6 py-4 border-b border-blue-100 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FileSignature className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900">
                                            {t("ententesemployeurs:modal.title")}
                                        </h3>
                                        <p className="text-sm text-blue-700">
                                            {selectedEntente.titre}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Contenu du modal */}
                        <div className="p-6 space-y-6">
                            {/* Informations de l'étudiant */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t("ententesemployeurs:modal.student")}
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-gray-800">
                                        <span className="font-medium">{t("ententesemployeurs:modal.name")}:</span> {selectedEntente.etudiantPrenom} {selectedEntente.etudiantNom}
                                    </p>
                                    <p className="text-gray-800">
                                        <span className="font-medium">{t("ententesemployeurs:modal.email")}:</span> {selectedEntente.etudiantEmail}
                                    </p>
                                </div>
                            </div>

                            {/* Informations du stage */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    {t("ententesemployeurs:modal.internshipInfo")}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">{t("ententesemployeurs:modal.startDate")}</p>
                                        <p className="font-medium text-gray-900">{selectedEntente.dateDebut}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t("ententesemployeurs:modal.endDate")}</p>
                                        <p className="font-medium text-gray-900">{selectedEntente.dateFin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t("ententesemployeurs:modal.schedule")}</p>
                                        <p className="font-medium text-gray-900">{selectedEntente.horaire}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t("ententesemployeurs:modal.weeklyHours")}</p>
                                        <p className="font-medium text-gray-900">{selectedEntente.dureeHebdomadaire}h/{t("ententesemployeurs:week")}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600">{t("ententesemployeurs:modal.remuneration")}</p>
                                        <p className="font-medium text-gray-900">{selectedEntente.remuneration}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    {t("ententesemployeurs:modal.description")}
                                </h4>
                                <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                                    {selectedEntente.description}
                                </p>
                            </div>

                            {/* Responsabilités */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    {t("ententesemployeurs:modal.responsibilities")}
                                </h4>
                                <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                                    {selectedEntente.responsabilites}
                                </p>
                            </div>

                            {/* Objectifs */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                    {t("ententesemployeurs:modal.objectives")}
                                </h4>
                                <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                                    {selectedEntente.objectifs}
                                </p>
                            </div>
                        </div>

                        {/* Pied du modal */}
                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
                            <button
                                onClick={closeModal}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                {t("ententesemployeurs:modal.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntentesEmployeurs;
