import {useState, useEffect} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Clock, MapPin, Users, FileText, CheckCircle, X, ArrowLeft, User } from "lucide-react";
import NavBar from "./NavBar.tsx";
import * as React from "react";
import { useTranslation } from 'react-i18next';
import { employeurService } from '../services/EmployeurService';

interface ConvocationFormData {
    titre: string;
    description: string;
    dateEntrevue: string;
    heureDebut: string;
    heureFin: string;
    lieu: string;
    etudiant: string;
    offreStage: string;
    noteSupplementaire: string;
}

const CreerConvocation = () => {
    const { t } = useTranslation(["convocation"]);
    const navigate = useNavigate();
    const location = useLocation();

    // If coming from candidatures page, we may receive state to prefill the form
    const incomingState = (location as any).state || {};

    const [formData, setFormData] = useState<ConvocationFormData>({
        titre: "",
        description: "",
        dateEntrevue: "",
        heureDebut: "",
        heureFin: "",
        lieu: "",
        etudiant: "",
        offreStage: "",
        noteSupplementaire: "",
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [existingConvocationId, setExistingConvocationId] = useState<number | null>(null);
    const [candidatureId, setCandidatureId] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>("");

    // Prefill from incoming state when available
    useEffect(() => {
        if (incomingState) {
            const { candidatureId, etudiantPrenom, etudiantNom, offreTitre, convocation } = incomingState;
            if (candidatureId) setCandidatureId(candidatureId);
            if (etudiantPrenom || etudiantNom) {
                setFormData(prev => ({ ...prev, etudiant: `${etudiantPrenom || ''} ${etudiantNom || ''}`.trim() }));
            }
            if (offreTitre) setFormData(prev => ({ ...prev, offreStage: offreTitre }));
            if (convocation) {
                // convocation expected shape: { id, dateHeure, lieuOuLien, message }
                setIsEditMode(true);
                try {
                    const dt = new Date(convocation.dateHeure);
                    const dateStr = dt.toISOString().split('T')[0];
                    const timeStr = dt.toTimeString().split(':').slice(0,2).join(':');
                    setFormData(prev => ({
                        ...prev,
                        titre: prev.titre || t('convocation:defaults.title'),
                        description: convocation.message || prev.description,
                        dateEntrevue: dateStr,
                        heureDebut: timeStr,
                        heureFin: timeStr,
                        lieu: convocation.lieuOuLien || prev.lieu,
                        noteSupplementaire: prev.noteSupplementaire
                    }));
                } catch(e) {
                    // ignore parsing errors
                }
                if (convocation.id) setExistingConvocationId(convocation.id);
            }
        }
    }, [incomingState, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors.length > 0) setErrors([]);
    };

    const validateForm = (): string[] => {
        const validationErrors: string[] = [];
        if (!formData.titre.trim()) validationErrors.push(t("convocation:errors.titleRequired"));
        if (!formData.description.trim()) validationErrors.push(t("convocation:errors.descriptionRequired"));
        if (!formData.dateEntrevue) validationErrors.push(t("convocation:errors.interviewDateRequired"));
        if (!formData.heureDebut) validationErrors.push(t("convocation:errors.startTimeRequired"));
        if (!formData.heureFin) validationErrors.push(t("convocation:errors.endTimeRequired"));
        if (!formData.lieu.trim()) validationErrors.push(t("convocation:errors.locationRequired"));
        if (!formData.etudiant.trim()) validationErrors.push(t("convocation:errors.studentRequired"));
        if (!formData.offreStage.trim()) validationErrors.push(t("convocation:errors.internshipOfferRequired"));

        // Validation des heures
        if (formData.heureDebut && formData.heureFin && formData.heureDebut >= formData.heureFin) {
            validationErrors.push(t("convocation:errors.endTimeAfterStartTime"));
        }

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

        if (!candidatureId) {
            setErrors([t('convocation:errors.missingCandidature')]);
            return;
        }

        setLoading(true);

        try {
            // Build date-time
            const dateTime = new Date(`${formData.dateEntrevue}T${formData.heureDebut}:00`);

            const payload = {
                dateHeure: dateTime.toISOString(),
                lieuOuLien: formData.lieu,
                message: formData.noteSupplementaire || formData.description
            };

            if (isEditMode && existingConvocationId) {
                // modify existing convocation
                await employeurService.modifierConvocation(existingConvocationId, payload);
                setSuccessMessage(t('convocation:success.convocationUpdated'));
            } else {
                // If there's already a convocation for this candidature, ask for confirmation to overwrite
                if (incomingState?.convocation) {
                    const ok = window.confirm(t('convocation:confirm.overwrite'));
                    if (!ok) {
                        setLoading(false);
                        return;
                    }
                }

                await employeurService.creerConvocation(candidatureId, payload);
                setSuccessMessage(t('convocation:success.convocationCreated'));
            }

            setTimeout(() => {
                navigate("/candidatures-recues");
            }, 1500);
        } catch (error: any) {
            console.error('Erreur lors de la création de la convocation:', error);
            const msg = error?.message || t('convocation:errors.genericError');
            setErrors([msg]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelConvocation = async () => {
        if (!existingConvocationId) return;
        const confirmCancel = window.confirm(t('convocation:confirm.cancel'));
        if (!confirmCancel) return;
        setLoading(true);
        try {
            await employeurService.annulerConvocation(existingConvocationId);
            setSuccessMessage(t('convocation:success.convocationCanceled'));
            setTimeout(() => navigate('/candidatures-recues'), 1200);
        } catch (err: any) {
            console.error('Erreur annulation convocation:', err);
            setErrors([err?.message || t('convocation:errors.genericError')]);
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
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">{t("convocation:return.message")}</span>
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {isEditMode ? t("convocation:titleEdit") : t("convocation:title")}
                    </h1>
                    <p className="text-gray-600">
                        {t("convocation:subtitle")}
                    </p>
                </div>

                {/* Messages d'erreur */}
                {errors.length > 0 && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-900 mb-2">{t("convocation:errors.errorMessageSection")}</h3>
                                <ul className="space-y-1">
                                    {errors.map((error, idx) => (
                                        <li key={idx} className="text-sm text-red-700">• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message de succès */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">{successMessage}</p>
                                <p className="text-xs text-green-700 mt-1">{t("convocation:success.redirecting")}</p>
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
                                <FileText className="w-4 h-4 text-blue-600" />
                                {t("convocation:form.title")} *
                            </label>
                            <input
                                type="text"
                                name="titre"
                                value={formData.titre}
                                onChange={handleChange}
                                placeholder={t("convocation:placeholders.title")}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={loading}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                {t("convocation:form.description")} *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t("convocation:placeholders.description")}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                rows={4}
                                disabled={loading}
                            />
                        </div>

                        {/* Sélection étudiant et offre */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    {t("convocation:form.student")} *
                                </label>
                                <select
                                    name="etudiant"
                                    value={formData.etudiant}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                >
                                    <option value="">{t("convocation:placeholders.selectStudent")}</option>
                                    <option value="etudiant1">Jean Dupont</option>
                                    <option value="etudiant2">Marie Martin</option>
                                    <option value="etudiant3">Pierre Dubois</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    {t("convocation:form.internshipOffer")} *
                                </label>
                                <select
                                    name="offreStage"
                                    value={formData.offreStage}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                >
                                    <option value="">{t("convocation:placeholders.selectOffer")}</option>
                                    <option value="offre1">Développeur Web Junior</option>
                                    <option value="offre2">Analyste de données</option>
                                    <option value="offre3">Designer UX/UI</option>
                                </select>
                            </div>
                        </div>

                        {/* Date et heures */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    {t("convocation:form.interviewDate")} *
                                </label>
                                <input
                                    type="date"
                                    name="dateEntrevue"
                                    value={formData.dateEntrevue}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    {t("convocation:form.startTime")} *
                                </label>
                                <input
                                    type="time"
                                    name="heureDebut"
                                    value={formData.heureDebut}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    {t("convocation:form.endTime")} *
                                </label>
                                <input
                                    type="time"
                                    name="heureFin"
                                    value={formData.heureFin}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Lieu */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                {t("convocation:form.location")} *
                            </label>
                            <input
                                type="text"
                                name="lieu"
                                value={formData.lieu}
                                onChange={handleChange}
                                placeholder={t("convocation:placeholders.location")}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={loading}
                            />
                        </div>

                        {/* Notes supplémentaires */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                {t("convocation:form.additionalNotes")}
                            </label>
                            <textarea
                                name="noteSupplementaire"
                                value={formData.noteSupplementaire}
                                onChange={handleChange}
                                placeholder={t("convocation:placeholders.additionalNotes")}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                rows={3}
                                disabled={loading}
                            />
                        </div>

                        {/* Boutons */}
                        <div className="flex gap-4 pt-4">
                             <button
                                 type="button"
                                 onClick={() => navigate(-1)}
                                 className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                                 disabled={loading}
                             >
                                 {t("convocation:button.cancel")}
                             </button>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleCancelConvocation}
                                    className="px-6 py-3 border-2 border-red-300 text-red-700 font-medium rounded-xl hover:bg-red-50 transition-all duration-200"
                                    disabled={loading}
                                >
                                    {t('convocation:button.cancelConvocation')}
                                </button>
                            )}

                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t("convocation:button.creating")}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        {t("convocation:button.create")}
                                    </>
                                )}
                            </button>
                         </div>
                     </div>
                 </form>
             </div>
         </div>
     );
 };

 export default CreerConvocation;
