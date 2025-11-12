import { useState, useEffect } from "react";
import {
    FileSignature,
    User,
    Building2,
    AlertCircle,
    Briefcase,
    X, ArrowLeft,
} from "lucide-react";
import NavBar from "./NavBar.tsx";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { gestionnaireService, type CandidatureEligibleDTO, type EntenteStageDTO, type OffreDTO } from "../services/GestionnaireService";

const EntentesStageGestionnaire = () => {
    const { t } = useTranslation(['ententesStageGestionnaire' , 'programmes']);
    const [loading, setLoading] = useState(true);
    const [candidatures, setCandidatures] = useState<CandidatureEligibleDTO[]>([]);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidature, setSelectedCandidature] = useState<CandidatureEligibleDTO | null>(null);
    const [offerDetails, setOfferDetails] = useState<OffreDTO | null>(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const token = sessionStorage.getItem("authToken") || "";

    useEffect(() => {
        const fetchCandidaturesEligibles = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await gestionnaireService.getCandidaturesEligiblesEntente(token);
                setCandidatures(data);
            } catch (err: any) {
                setError(err.message || t('errors.loading'));
                setCandidatures([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidaturesEligibles().then();
    }, [token]);

    const handleCandidatureClick = (candidature: CandidatureEligibleDTO) => {
        setSelectedCandidature(candidature);
        // attempt to fetch offer details to show richer entente info in the modal
        (async () => {
            try {
                const offres = await gestionnaireService.getAllOffres(token);
                const found = offres.find(o => o.id === candidature.offreId);
                setOfferDetails(found || null);
            } catch (e) {
                console.warn('Could not load offer details for modal', e);
                setOfferDetails(null);
            }
        })();
        setShowModal(true);
        setError("");
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCandidature(null);
        setError("");
    };

    const handleStartEntente = async () => {
        if (!selectedCandidature) return;
        if (!selectedCandidature.etudiantId) {
            setError(t('errors.missingStudentId'));
            return;
        }

        setIsSubmitting(true);
        setError("");
        setSuccessMessage("");

        try {
            // Attempt to fetch the full offer details to enrich the entente payload
            let offerDetails: OffreDTO | undefined;
            try {
                const offres = await gestionnaireService.getAllOffres(token);
                offerDetails = offres.find(o => o.id === selectedCandidature!.offreId);
            } catch (e) {
                // Fetching offer details is optional; continue with minimal data if it fails
                console.warn('Could not fetch offer details for entente enrichment', e);
            }

            const ententeData: EntenteStageDTO = {
                etudiantId: selectedCandidature.etudiantId,
                offreId: selectedCandidature.offreId,
                titre: selectedCandidature.offreTitre,
                // enrich with whatever we can obtain from the offer and candidature
                dateDebut: offerDetails?.date_debut || undefined,
                dateFin: offerDetails?.date_fin || undefined,
                description: offerDetails?.description || undefined,
                remuneration: offerDetails?.remuneration || undefined,
                responsabilitesEtudiant: (offerDetails as any)?.responsabilitesEtudiant || undefined,
                responsabilitesEmployeur: (offerDetails as any)?.responsabilitesEmployeur || undefined,
                responsabilitesCollege: (offerDetails as any)?.responsabilitesCollege || undefined,
                objectifs: (offerDetails as any)?.objectifs || undefined,
                horaire: (offerDetails as any)?.horaire || undefined,
                dureeHebdomadaire: (offerDetails as any)?.dureeHebdomadaire || undefined,
                etudiantNom: selectedCandidature.etudiantNom,
                etudiantPrenom: selectedCandidature.etudiantPrenom,
                etudiantEmail: (selectedCandidature as any).etudiantEmail,
                employeurNom: selectedCandidature.employeurNom,
            } as unknown as EntenteStageDTO;

            await gestionnaireService.creerEntente(ententeData, token);

            setSuccessMessage(t('success.created'));
            closeModal();
            gestionnaireService.getCandidaturesEligiblesEntente(token)
                .then(data => setCandidatures(data))
                .catch(err => setError(err.message));

        } catch (err: any) {
            const responseData = err.response?.data;

            if (responseData?.erreur?.errorCode) {
                setError(t('errors.errorCode', {
                    code: responseData.erreur.errorCode,
                    message: responseData.erreur.message
                }));
            } else if (err.message) {
                setError(err.message);
            } else {
                setError(t('errors.creationFailed'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProgrammeLabel = (offreStage: String) => {
        const raw = offreStage;
        const prog = raw == null ? '' : String(raw).trim();
        return t(`programmes:${prog}`, { defaultValue: prog });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <button
                    onClick={() => navigate('/dashboard-gestionnaire')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    {t('backToDashboard')}
                </button>
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {t('title')}
                            </h1>
                            <p className="text-gray-600">
                                {t('subtitle')}
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
                            <button onClick={() => setError("")} className="cursor-pointer ml-auto text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <FileSignature className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-900">{successMessage}</p>
                            <button onClick={() => setSuccessMessage("")} className="cursor-pointer ml-auto text-green-600 hover:text-green-800">
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
                    /* Message : Aucune candidature éligible */
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {t('emptyState.title')}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {t('emptyState.description')}
                        </p>
                    </div>
                ) : (
                    /* Liste des candidatures éligibles */
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{candidatures.length}</span> {t('list.count', { count: candidatures.length })}
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
                                            {t('list.statusAccepted')}
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
                                            {t('list.clickToCreate')}
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
                                        {t('modal.title')}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {t('modal.forStudent', {
                                            firstName: selectedCandidature.etudiantPrenom,
                                            lastName: selectedCandidature.etudiantNom
                                        })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Application info */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <h3 className="font-semibold text-gray-900">{t('modal.applicationInfo.title')}</h3>
                                <div className="mt-3 grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">{t('modal.applicationInfo.student')}</div>
                                        <div className="font-semibold text-gray-900">{selectedCandidature.etudiantPrenom} {selectedCandidature.etudiantNom}</div>
                                        <div className="text-xs text-gray-600">{(selectedCandidature as any).etudiantEmail}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">{t('modal.applicationInfo.employer')}</div>
                                        <div className="font-semibold text-gray-900">{selectedCandidature.employeurNom}</div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="text-gray-600">{t('modal.applicationInfo.position')}</div>
                                        <div className="font-semibold text-gray-900">{selectedCandidature.offreTitre}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Offer details (attempt to show fields if available on the entente payload) */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-gray-900 mb-2">{t('modal.ententeDetails.title')}</h4>
                                <div className="grid gap-3 text-sm">
                                    <div>
                                        <strong>{t('fields.description')}:</strong> {(selectedCandidature as any).description || selectedCandidature.offreTitre || '-'}
                                    </div>

                                    <div className="flex gap-4 flex-wrap text-gray-700">
                                        <div><strong>{t('fields.program')}:</strong> {getProgrammeLabel(offerDetails?.progEtude)}</div>
                                        <div><strong>{t('fields.location')}:</strong> {offerDetails?.lieuStage || (selectedCandidature as any).lieuStage || '-'}</div>
                                        <div><strong>{t('fields.remuneration')}:</strong> {offerDetails?.remuneration || (selectedCandidature as any).remuneration || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 justify-end">
                                <button onClick={closeModal} disabled={isSubmitting} className="cursor-pointer px-6 py-3 border rounded-lg">{t('buttons.cancel')}</button>
                                <button onClick={handleStartEntente} disabled={isSubmitting} className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg">{isSubmitting ? t('buttons.creating') : t('buttons.startEntenteProcess')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EntentesStageGestionnaire;

