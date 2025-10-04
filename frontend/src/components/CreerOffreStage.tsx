import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, DollarSign, Calendar, GraduationCap, FileText, CheckCircle, X } from "lucide-react";
import { employeurService } from "../services/EmployeurService";
import utilisateurService from "../services/UtilisateurService";
import type { OffreStageDTO } from "../services/EmployeurService";
import NavBar from "./NavBar.tsx";
import * as React from "react";
import { useTranslation } from 'react-i18next';

const CreerOffreStage = () => {
    const { t: tProgrammes } = useTranslation('programmes');
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
    const [programmes, setProgrammes] = useState<string[]>([]);
    const [loadingProgrammes, setLoadingProgrammes] = useState(true);

    const token = sessionStorage.getItem("authToken") || "";

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
        loadProgrammes().then();
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

        } catch (error: any) {
            console.error('Erreur lors de la création de l\'offre:', error);

            // Gestion des erreurs réseau
            if (error.code === 'ERR_NETWORK') {
                setErrors(['Erreur de connexion au serveur']);
                return;
            }

            const responseData = error.response?.data;

            if (!responseData) {
                setErrors(['Une erreur est survenue']);
                return;
            }

            if (responseData.erreur?.errorCode) {
                setErrors([`Erreur: ${responseData.erreur.message || responseData.erreur.errorCode}`]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar/>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Créer une offre de stage
                    </h1>
                    <p className="text-gray-600">
                        Remplissez les informations pour publier votre offre
                    </p>
                </div>

                {/* Messages */}
                {errors.length > 0 && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-900 mb-2">Erreurs de validation</h3>
                                <ul className="space-y-1">
                                    {errors.map((error, idx) => (
                                        <li key={idx} className="text-sm text-red-700">• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">{successMessage}</p>
                                <p className="text-xs text-green-700 mt-1">Redirection en cours...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-8 border border-slate-200">
                    <div className="space-y-6">
                        {/* Titre */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                Titre de l'offre *
                            </label>
                            <input
                                type="text"
                                name="titre"
                                value={formData.titre}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Ex: Développeur web junior"
                                disabled={loading}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                rows={5}
                                placeholder="Décrivez les missions, compétences requises..."
                                disabled={loading}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    Date de début *
                                </label>
                                <input
                                    type="date"
                                    name="date_debut"
                                    value={formData.date_debut}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    Date de fin *
                                </label>
                                <input
                                    type="date"
                                    name="date_fin"
                                    value={formData.date_fin}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Programme d'étude */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <GraduationCap className="w-4 h-4 text-blue-600" />
                                Programme d'étude *
                            </label>
                            {loadingProgrammes ? (
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="text-gray-600 text-sm">Chargement...</span>
                                </div>
                            ) : (
                                <select
                                    name="progEtude"
                                    value={formData.progEtude}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                >
                                    <option value="">Sélectionnez un programme</option>
                                    {programmes.map(key => (
                                        <option key={key} value={key}>{tProgrammes(key)}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Lieu et Rémunération */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    Lieu du stage *
                                </label>
                                <input
                                    type="text"
                                    name="lieuStage"
                                    value={formData.lieuStage}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Ex: Montréal, QC"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                    Rémunération *
                                </label>
                                <input
                                    type="text"
                                    name="remuneration"
                                    value={formData.remuneration}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Ex: 20$/h"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Date limite */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Date limite de candidature *
                            </label>
                            <input
                                type="date"
                                name="dateLimite"
                                value={formData.dateLimite}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={loading}
                            />
                        </div>

                        {/* Bouton de soumission */}
                        <button
                            type="submit"
                            disabled={loading || loadingProgrammes}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-400 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <Briefcase className="w-5 h-5" />
                                    Créer l'offre de stage
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreerOffreStage;