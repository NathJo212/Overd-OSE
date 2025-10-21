import { useState, useEffect } from "react";
import {
    FileSignature,
    User,
    Building2,
    Calendar,
    DollarSign,
    AlertCircle,
    Briefcase,
    X,
    FileText,
    CheckCircle
} from "lucide-react";
import NavBar from "./NavBar.tsx";
import { gestionnaireService, type CandidatureEligibleDTO, type EntenteStageDTO } from "../services/GestionnaireService";
import * as React from "react";

const EntentesStageGestionnaire = () => {
    const [loading, setLoading] = useState(true);
    const [candidatures, setCandidatures] = useState<CandidatureEligibleDTO[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidature, setSelectedCandidature] = useState<CandidatureEligibleDTO | null>(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const token = sessionStorage.getItem("authToken") || "";

    useEffect(() => {
        const fetchCandidaturesEligibles = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await gestionnaireService.getCandidaturesEligiblesEntente(token);
                setCandidatures(data);
            } catch (err: any) {
                setError(err.message || "Erreur lors du chargement des candidatures");
                setCandidatures([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidaturesEligibles().then();
    }, [token]);

    const handleCandidatureClick = (candidature: CandidatureEligibleDTO) => {
        setSelectedCandidature(candidature);
        setShowModal(true);
        setError("");
        setSuccessMessage("");
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCandidature(null);
        setError("");
        setSuccessMessage("");
        setDateDebut("");
        setDateFin("");
    };

    const handleSubmitEntente = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCandidature) return;

        // Validation supplémentaire pour les dates
        if (dateFin && dateDebut && dateFin < dateDebut) {
            setError("La date de fin doit être après la date de début");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setSuccessMessage("");

        try {
            const formData = new FormData(e.target as HTMLFormElement);

            // Vérifier que nous avons l'etudiantId
            if (!selectedCandidature.etudiantId) {
                setError("Impossible de créer l'entente : ID étudiant manquant. Le backend doit être mis à jour pour inclure 'etudiantId' dans CandidatureDTO.");
                return;
            }

            const ententeData: EntenteStageDTO = {
                etudiantId: selectedCandidature.etudiantId,
                offreId: selectedCandidature.offreId,
                titre: selectedCandidature.offreTitre,
                description: formData.get('description') as string,
                dateDebut: formData.get('dateDebut') as string,
                dateFin: formData.get('dateFin') as string,
                horaire: formData.get('horaire') as string,
                dureeHebdomadaire: parseInt(formData.get('dureeHebdomadaire') as string),
                remuneration: formData.get('remuneration') as string,
                responsabilites: formData.get('responsabilites') as string,
                objectifs: formData.get('objectifs') as string
            };

            console.log("Données envoyées au backend:", ententeData);
            console.log("Candidature sélectionnée:", selectedCandidature);

            await gestionnaireService.creerEntente(ententeData, token);

            setSuccessMessage("Entente créée avec succès !");

            setTimeout(() => {
                closeModal();
                // Recharger les candidatures ← Déjà implémenté !
                gestionnaireService.getCandidaturesEligiblesEntente(token)
                    .then(data => setCandidatures(data))
                    .catch(err => setError(err.message));
            }, 2000);

        } catch (err: any) {
            console.error("Erreur lors de la création de l'entente:", err);
            const responseData = err.response?.data;

            if (responseData?.erreur?.errorCode) {
                setError(`Erreur (${responseData.erreur.errorCode}): ${responseData.erreur.message}`);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Erreur lors de la création de l'entente. Vérifiez que le backend est correctement configuré.");
            }
        } finally {
            setIsSubmitting(false);
        }
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

                {/* Erreur */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900">{error}</p>
                            <button onClick={() => setError("")} className="ml-auto text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                            </button>
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
                ) : candidatures.length === 0 ? (
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
                                <span className="font-semibold text-gray-900">{candidatures.length}</span> candidature(s) éligible(s) pour la création d'entente
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {candidatures.map((candidature) => (
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
                                            {new Date(candidature.dateCandidature).toLocaleDateString('fr-CA')}
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
                                                    {candidature.etudiantPrenom} {candidature.etudiantNom}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {candidature.etudiantEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Offre */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900 text-sm truncate">
                                                {candidature.offreTitre}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Building2 className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{candidature.employeurNom}</span>
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto"
                    onClick={(e) => e.target === e.currentTarget && closeModal()}
                >
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
                                        Pour {selectedCandidature.etudiantPrenom} {selectedCandidature.etudiantNom}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Message de succès dans le modal */}
                        {successMessage && (
                            <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <p className="text-sm font-medium text-green-900">{successMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Erreur dans le modal */}
                        {error && (
                            <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <p className="text-sm font-medium text-red-900">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Formulaire dans le modal */}
                        <form onSubmit={handleSubmitEntente} className="p-6">
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
                                            {selectedCandidature.etudiantPrenom} {selectedCandidature.etudiantNom}
                                        </p>
                                        <p className="text-xs text-gray-600">{selectedCandidature.etudiantEmail}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Employeur:</span>
                                        <p className="font-semibold text-gray-900">{selectedCandidature.employeurNom}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-gray-600">Poste:</span>
                                        <p className="font-semibold text-gray-900">{selectedCandidature.offreTitre}</p>
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
                                            name="dateDebut"
                                            required
                                            disabled={isSubmitting}
                                            value={dateDebut}
                                            onChange={(e) => setDateDebut(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date de fin <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="dateFin"
                                            required
                                            disabled={isSubmitting}
                                            value={dateFin}
                                            onChange={(e) => setDateFin(e.target.value)}
                                            min={dateDebut || undefined}
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
                                        />
                                        {dateFin && dateDebut && dateFin < dateDebut && (
                                            <p className="mt-1 text-sm text-red-600">
                                                La date de fin doit être après la date de début
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Horaire <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="horaire"
                                            required
                                            disabled={isSubmitting}
                                            placeholder="Ex: Lundi au vendredi, 9h-17h"
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Durée hebdomadaire (heures) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="dureeHebdomadaire"
                                            required
                                            disabled={isSubmitting}
                                            placeholder="Ex: 35"
                                            min="1"
                                            max="40"
                                            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
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
                                        name="remuneration"
                                        required
                                        disabled={isSubmitting}
                                        placeholder="Ex: 18$/heure ou Non rémunéré"
                                        className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
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
                                            name="description"
                                            required
                                            disabled={isSubmitting}
                                            rows={4}
                                            placeholder="Décrivez les principales tâches et responsabilités..."
                                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Responsabilités du stagiaire <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="responsabilites"
                                            required
                                            disabled={isSubmitting}
                                            rows={4}
                                            placeholder="Listez les principales responsabilités..."
                                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Objectifs d'apprentissage <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="objectifs"
                                            required
                                            disabled={isSubmitting}
                                            rows={4}
                                            placeholder="Décrivez les compétences à acquérir..."
                                            className="w-full resize-none rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 text-sm disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex gap-4 justify-end pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-400 disabled:shadow-none flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            <FileSignature className="w-4 h-4" />
                                            Créer l'entente
                                        </>
                                    )}
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