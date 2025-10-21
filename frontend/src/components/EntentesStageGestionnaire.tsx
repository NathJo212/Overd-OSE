import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileSignature,
    User,
    Building2,
    Calendar,
    DollarSign,
    AlertCircle,
    GraduationCap,
    Briefcase,
    X,
    FileText
} from "lucide-react";
import NavBar from "./NavBar.tsx";

const EntentesStageGestionnaire = () => {
    useNavigate();
    const [loading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidature, setSelectedCandidature] = useState<any>(null);

    // TODO: Remplacer par un vrai appel API
    // useEffect(() => {
    //     const fetchCandidaturesEligibles = async () => {
    //         const data = await gestionnaireService.getCandidaturesEligibles(token);
    //         setCandidaturesEligibles(data);
    //     };
    //     fetchCandidaturesEligibles();
    // }, []);

    // Pour la démo UI: mettre à true pour voir le message "aucune candidature", false pour voir la liste
    const hasCandidaturesEligibles = false;

    // Données mockées pour la visualisation UI uniquement
    const mockCandidaturesEligibles = [
        {
            id: 1,
            etudiant: {
                nom: "Dubois",
                prenom: "Jean",
                email: "jean.dubois@example.com",
                programme: "Techniques de l'informatique"
            },
            offre: {
                titre: "Développeur Full-Stack",
                employeur: "TechCorp Inc.",
                dateDebut: "2025-05-15",
                dateFin: "2025-08-15",
                remuneration: "20$/heure",
                lieu: "Montréal, QC"
            },
            dateAcceptation: "2025-01-15"
        },
        {
            id: 2,
            etudiant: {
                nom: "Martin",
                prenom: "Sophie",
                email: "sophie.martin@example.com",
                programme: "Design graphique"
            },
            offre: {
                titre: "Designer UX/UI",
                employeur: "Creative Studios",
                dateDebut: "2025-06-01",
                dateFin: "2025-09-01",
                remuneration: "18$/heure",
                lieu: "Laval, QC"
            },
            dateAcceptation: "2025-01-20"
        },
        {
            id: 3,
            etudiant: {
                nom: "Tremblay",
                prenom: "Marc",
                email: "marc.tremblay@example.com",
                programme: "Techniques de l'informatique"
            },
            offre: {
                titre: "Analyste de données",
                employeur: "DataTech Solutions",
                dateDebut: "2025-05-20",
                dateFin: "2025-08-20",
                remuneration: "22$/heure",
                lieu: "Québec, QC"
            },
            dateAcceptation: "2025-01-18"
        }
    ];

    const handleCandidatureClick = (candidature: any) => {
        setSelectedCandidature(candidature);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCandidature(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Ententes de stage
                            </h1>
                            <p className="text-gray-600">
                                Créez des ententes pour les candidatures acceptées
                            </p>
                        </div>
                    </div>
                </div>

                {/* État de chargement */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    </div>
                ) : !hasCandidaturesEligibles ? (
                    /* Message: Aucune candidature éligible */
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Aucune candidature éligible
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Il n'y a actuellement aucune candidature acceptée par l'étudiant et l'employeur nécessitant une entente de stage.
                        </p>
                    </div>
                ) : (
                    /* Liste des candidatures éligibles */
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{mockCandidaturesEligibles.length}</span> candidature(s) éligible(s) pour la création d'entente
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {mockCandidaturesEligibles.map((candidature) => (
                                <div
                                    key={candidature.id}
                                    onClick={() => handleCandidatureClick(candidature)}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-6 border border-slate-200 cursor-pointer group"
                                >
                                    {/* Badge statut */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                            Acceptée
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {candidature.dateAcceptation}
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
                                                    {candidature.etudiant.prenom} {candidature.etudiant.nom}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate mb-1">
                                                    {candidature.etudiant.email}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <GraduationCap className="w-3 h-3" />
                                                    <span className="truncate">{candidature.etudiant.programme}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Offre */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900 text-sm truncate">
                                                {candidature.offre.titre}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Building2 className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{candidature.offre.employeur}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-xs">{candidature.offre.dateDebut} → {candidature.offre.dateFin}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <DollarSign className="w-4 h-4 flex-shrink-0" />
                                            <span>{candidature.offre.remuneration}</span>
                                        </div>
                                    </div>

                                    {/* Indicateur hover */}
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700 flex items-center gap-2">
                                            <FileSignature className="w-4 h-4" />
                                            Cliquer pour créer l'entente
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de création d'entente */}
            {showModal && selectedCandidature && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
                        {/* En-tête du modal */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <FileSignature className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Créer une entente de stage
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Pour {selectedCandidature.etudiant.prenom} {selectedCandidature.etudiant.nom}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Formulaire dans le modal */}
                        <form className="p-6">
                            {/* Info candidature (lecture seule) */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Informations de la candidature
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Étudiant:</span>
                                        <p className="font-semibold text-gray-900">
                                            {selectedCandidature.etudiant.prenom} {selectedCandidature.etudiant.nom}
                                        </p>
                                        <p className="text-xs text-gray-600">{selectedCandidature.etudiant.email}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Programme:</span>
                                        <p className="font-semibold text-gray-900">{selectedCandidature.etudiant.programme}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Employeur:</span>
                                        <p className="font-semibold text-gray-900">{selectedCandidature.offre.employeur}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Poste:</span>
                                        <p className="font-semibold text-gray-900">{selectedCandidature.offre.titre}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Période et horaire */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Période et horaire
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date de début <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            defaultValue={selectedCandidature.offre.dateDebut}
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date de fin <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            defaultValue={selectedCandidature.offre.dateFin}
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Horaire <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Lundi au vendredi, 9h-17h"
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Durée hebdomadaire (heures) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 35"
                                            min="1"
                                            max="40"
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Rémunération */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                    Rémunération
                                </h3>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Rémunération <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={selectedCandidature.offre.remuneration}
                                        placeholder="Ex: 18$/heure"
                                        className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Section: Description et objectifs */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Description et objectifs
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description du stage <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Décrivez les principales tâches et responsabilités..."
                                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Responsabilités du stagiaire <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Listez les principales responsabilités..."
                                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Objectifs d'apprentissage <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Décrivez les compétences à acquérir..."
                                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex gap-4 justify-end pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-400 flex items-center gap-2"
                                >
                                    <FileSignature className="w-4 h-4" />
                                    Créer l'entente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntentesStageGestionnaire;