import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { employeurService } from "../services/EmployeurService";
import utilisateurService from "../services/UtilisateurService";
import type { OffreStageDTO } from "../services/EmployeurService";
import NavBar from "./NavBar.tsx";
import * as React from "react";

const CreerOffreStage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
        }
    }, [navigate]);

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

    // Add state for programs
    const [programmes, setProgrammes] = useState<{[key: string]: string}>({});
    const [loadingProgrammes, setLoadingProgrammes] = useState(true);

    const token = sessionStorage.getItem("authToken") || "";

    // Load programs on component mount
    useEffect(() => {
        const loadProgrammes = async () => {
            try {
                setLoadingProgrammes(true);
                const programmesData = await utilisateurService.getAllProgrammes();
                setProgrammes(programmesData);
            } catch (error) {
                console.error('Erreur lors du chargement des programmes:', error);
                setErrors(['Erreur lors du chargement des programmes']);
            } finally {
                setLoadingProgrammes(false);
            }
        };

        loadProgrammes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        <>
            <NavBar/>
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
                            {loadingProgrammes ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-gray-500 text-sm">Chargement des programmes...</span>
                                </div>
                            ) : (
                                <select
                                    name="progEtude"
                                    value={formData.progEtude}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    disabled={loading}
                                >
                                    <option value="">Sélectionnez le programme d'étude</option>
                                    {Object.entries(programmes).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            )}
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
                        <button type="submit" disabled={loading || loadingProgrammes} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300">
                            {loading ? "Création en cours..." : "Créer l'offre"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreerOffreStage;