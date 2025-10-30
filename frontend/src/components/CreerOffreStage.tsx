import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, DollarSign, Calendar, GraduationCap, FileText, CheckCircle, X, ArrowLeft} from "lucide-react";
import { employeurService } from "../services/EmployeurService";
import utilisateurService from "../services/UtilisateurService";
import type { OffreStageDTO } from "../services/EmployeurService";
import NavBar from "./NavBar.tsx";
import * as React from "react";
import { useTranslation } from 'react-i18next';

const CreerOffreStage = () => {
    const { t } = useTranslation(["offercreate"]);
    const { t: tErrors } = useTranslation('errors');
    const { t: tProgrammes } = useTranslation('programmes');
    const navigate = useNavigate();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
        }
    }, [navigate]);

    // Local form type allows additional optional fields which may be useful later
    type FormDataType = Omit<OffreStageDTO, "utilisateur"> & {
        horaire?: string;
        dureeHebdomadaire?: string;
        responsabilites?: string;
        objectifs?: string;
    };

    const [formData, setFormData] = useState<FormDataType>({
        titre: "",
        description: "",
        date_debut: "",
        date_fin: "",
        progEtude: "",
        lieuStage: "",
        remuneration: "",
        dateLimite: "",
        horaire: "",
        dureeHebdomadaire: "",
        responsabilites: "",
        objectifs: "",
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
                setErrors([t('offercreate:errors.programsLoad')]);
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
        if (!formData.titre.trim()) validationErrors.push(t("offercreate:errors.titleRequired"));
        if (!formData.description.trim()) validationErrors.push(t("offercreate:errors.descriptionRequired"));
        if (!formData.date_debut) validationErrors.push(t("offercreate:errors.startDateRequired"));
        if (!formData.date_fin) validationErrors.push(t("offercreate:errors.endDateRequired"));
        if (!formData.progEtude?.toString().trim()) validationErrors.push(t("offercreate:errors.studyProgramRequired"));
        if (!formData.lieuStage.trim()) validationErrors.push(t("offercreate:errors.internshipLocationRequired"));
        if (!formData.remuneration.trim()) validationErrors.push(t("offercreate:errors.remunerationRequired"));
        if (!formData.dateLimite) validationErrors.push(t("offercreate:errors.deadlineRequired"));
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
            // Build payload including optional fields -- backend will ignore unknown fields if not supported
            const offrePayload: any = { ...formData, utilisateur: { token } };
            await employeurService.creerOffreDeStage(offrePayload);
            setSuccessMessage(t("offercreate:success.offerCreated"));
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
                setErrors([tErrors('ERROR_000')]);
                return;
            }

            if (responseData.erreur?.errorCode) {
                const code = responseData.erreur.errorCode;
                const backendMessage = responseData.erreur.message;
                const translated = tErrors(code);
                // tErrors returns the key when missing; prefer backend message if present
                if (backendMessage) {
                    setErrors([backendMessage]);
                } else if (translated && translated !== code) {
                    setErrors([translated]);
                } else {
                    setErrors([code]);
                }
                return;
            }

            if (responseData.errorResponse?.errorCode) {
                const code = responseData.errorResponse.errorCode;
                const translated = tErrors(code);
                setErrors([translated && translated !== code ? translated : code]);
                return;
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
                    <div className="w-full flex justify-start mb-6">
                        <button
                            onClick={() => navigate('/dashboard-employeur')}
                            className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">{t("offercreate:return.message")}</span>
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t("offercreate:title")}
                    </h1>
                    <p className="text-gray-600">
                        {t("offercreate:subtitle")}
                    </p>
                </div>

                {/* Messages */}
                {errors.length > 0 && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-900 mb-2">{t("offercreate:errors.errorMessageSection")}</h3>
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
                                <p className="text-xs text-green-700 mt-1">{t("offercreate:success.redirecting")}</p>
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
                                {t("offercreate:form.title")} *
                            </label>
                            <input
                                type="text"
                                name="titre"
                                value={formData.titre}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={loading}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                {t("offercreate:form.description")} *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                rows={5}
                                disabled={loading}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    {t("offercreate:form.startDate")} *
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
                                    {t("offercreate:form.endDate")} *
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
                                {t("offercreate:form.studyProgram")} *
                            </label>
                            {loadingProgrammes ? (
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="text-gray-600 text-sm">{t("offercreate:loading.programs")}</span>
                                </div>
                            ) : (
                                <select
                                    name="progEtude"
                                    value={formData.progEtude}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                >
                                    <option value="">{t("offercreate:form.selectProgram")}</option>
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
                                    {t("offercreate:form.internshipLocation")} *
                                </label>
                                <input
                                    type="text"
                                    name="lieuStage"
                                    value={formData.lieuStage}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                    {t("offercreate:form.remuneration")} *
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

                        {/* Horaire et Durée hebdomadaire (optionnel) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    {t("offercreate:form.schedule")}
                                </label>
                                <input
                                    type="text"
                                    name="horaire"
                                    value={formData.horaire}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder={t("offercreate:form.schedulePlaceholder")}
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    {t("offercreate:form.weeklyHours")}
                                </label>
                                <input
                                    type="number"
                                    name="dureeHebdomadaire"
                                    value={formData.dureeHebdomadaire}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder={t("offercreate:form.weeklyHoursPlaceholder")}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Responsabilités et Objectifs (optionnel) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                {t("offercreate:form.responsibilities")}
                            </label>
                            <textarea
                                name="responsabilites"
                                value={formData.responsabilites}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                rows={3}
                                disabled={loading}
                                placeholder={t("offercreate:form.responsibilitiesPlaceholder")}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                {t("offercreate:form.objectives")}
                            </label>
                            <textarea
                                name="objectifs"
                                value={formData.objectifs}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                rows={3}
                                disabled={loading}
                                placeholder={t("offercreate:form.objectivesPlaceholder")}
                            />
                        </div>

                        {/* Date limite */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                {t("offercreate:form.deadline")} *
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
                            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-400 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {t("offercreate:button.creating")}
                                </>
                            ) : (
                                <>
                                    <Briefcase className="w-5 h-5" />
                                    {t("offercreate:button.createOffer")}
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
