import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeurService } from "../services/EmployeurService";
import type { OffreStageDTO } from "../services/EmployeurService";

const CreerOffreStage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Omit<OffreStageDTO, "utilisateur">>({
        titre: "",
        description: "",
        date_debut: "",
        date_fin: "",
        progEtude: "",
        lieuStage: "",
        remuneration: "",
        dateLimite: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const token = sessionStorage.getItem("authToken") || "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors.length > 0) setErrors([]);
    };

    const validateForm = (): string[] => {
        const validationErrors: string[] = [];
        if (!formData.titre.trim()) validationErrors.push("Le titre est requis");
        if (!formData.description.trim()) validationErrors.push("La description est requise");
        if (!formData.date_debut) validationErrors.push("La date de début est requise");
        if (!formData.date_fin) validationErrors.push("La date de fin est requise");
        if (!formData.progEtude.trim()) validationErrors.push("Le programme d'étude est requis");
        if (!formData.lieuStage.trim()) validationErrors.push("Le lieu de stage est requis");
        if (!formData.remuneration.trim()) validationErrors.push("La rémunération est requise");
        if (!formData.dateLimite) validationErrors.push("La date limite est requise");
        return validationErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setSuccessMessage("");
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }
        setLoading(true);
        try {
            const offreDTO: OffreStageDTO = { ...formData, utilisateur: { token } };
            await employeurService.creerOffreDeStage(offreDTO);
            setSuccessMessage("Offre de stage créée avec succès !");
            setTimeout(() => {
                navigate("/dashboard-employeur");
            }, 2000);
        } catch (error) {
            setErrors([error instanceof Error ? error.message : "Erreur lors de la création de l'offre"]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Créer une offre de stage
                </h1>
                {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <ul className="list-disc list-inside space-y-1">
                            {errors.map((error, idx) => (
                                <li key={idx} className="text-red-700 text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800 font-medium text-center">
                        {successMessage}
                        <p className="text-green-600 text-sm mt-1">Redirection...</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                        <input type="text" name="titre" value={formData.titre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                        <input type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
                        <input type="date" name="date_fin" value={formData.date_fin} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Programme d'étude *</label>
                        <input type="text" name="progEtude" value={formData.progEtude} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lieu du stage *</label>
                        <input type="text" name="lieuStage" value={formData.lieuStage} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rémunération *</label>
                        <input type="text" name="remuneration" value={formData.remuneration} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date limite *</label>
                        <input type="date" name="dateLimite" value={formData.dateLimite} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={loading} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300">
                        {loading ? "Création en cours..." : "Créer l'offre"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreerOffreStage;