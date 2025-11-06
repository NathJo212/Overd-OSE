import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    X,
    ArrowLeft,
    RefreshCw,
    User,
    Calendar,
    FileText,
    Star,
    AlertCircle,
    Briefcase,
    ClipboardCheck,
    Users,
    Lightbulb,
    TrendingUp, Eye
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar";
import employeurService from '../services/EmployeurService';
import type {
    EntenteStageDTO,
    EvaluationDTO,
    CreerEvaluationDTO,
    NiveauAccord,
    AppreciationGlobale,
    EntrepriseProchainStageChoix
} from '../services/EmployeurService';

// Composant pour les boutons radio Likert
interface LikertRadioProps {
    name: string;
    value: NiveauAccord | null;
    onChange: (value: NiveauAccord) => void;
    label: string;
    required?: boolean;
}

const LikertRadio: React.FC<LikertRadioProps> = ({ name, value, onChange, label, required }) => {
    const { t } = useTranslation('evaluationStagiaire');

    const options: { value: NiveauAccord; labelKey: string; colorClass: string }[] = [
        { value: 'TOTALEMENT_EN_ACCORD', labelKey: 'likertScale.totallyAgree', colorClass: 'hover:bg-green-50 peer-checked:bg-green-100 peer-checked:border-green-500' },
        { value: 'PLUTOT_EN_ACCORD', labelKey: 'likertScale.agree', colorClass: 'hover:bg-blue-50 peer-checked:bg-blue-100 peer-checked:border-blue-500' },
        { value: 'PLUTOT_EN_DESACCORD', labelKey: 'likertScale.disagree', colorClass: 'hover:bg-yellow-50 peer-checked:bg-yellow-100 peer-checked:border-yellow-500' },
        { value: 'TOTALEMENT_EN_DESACCORD', labelKey: 'likertScale.totallyDisagree', colorClass: 'hover:bg-red-50 peer-checked:bg-red-100 peer-checked:border-red-500' },
        { value: 'NON_APPLICABLE', labelKey: 'likertScale.notApplicable', colorClass: 'hover:bg-gray-50 peer-checked:bg-gray-100 peer-checked:border-gray-500' }
    ];

    return (
        <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3 flex items-start">
                <span className="mr-2">•</span>
                <span>{label}</span>
                {required && <span className="text-red-500 ml-1">*</span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`relative flex items-center justify-center cursor-pointer border-2 rounded-lg p-3 transition-all ${
                            value === option.value ? 'ring-2 ring-offset-1' : ''
                        } ${option.colorClass}`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            className="peer sr-only"
                        />
                        <span className="text-xs font-medium text-gray-700 text-center">
                            {t(option.labelKey)}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

const EmployeurEvaluationStagiaire = () => {
    const { t } = useTranslation('evaluationStagiaire');
    const navigate = useNavigate();

    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [evaluations, setEvaluations] = useState<EvaluationDTO[]>([]);
    const [loadingEntentes, setLoadingEntentes] = useState(true);
    const [loadingEvaluations, setLoadingEvaluations] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState<'toEvaluate' | 'evaluated'>('toEvaluate');
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEntente, setSelectedEntente] = useState<EntenteStageDTO | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationDTO | null>(null);

    // Form data complet pour CreerEvaluationDTO
    const [formData, setFormData] = useState<Omit<CreerEvaluationDTO, 'ententeId'>>({
        // Informations du superviseur
        nomSuperviseur: '',
        fonctionSuperviseur: '',
        telephoneSuperviseur: '',
        dateSignature: new Date().toISOString().split('T')[0],

        // Section 1: PRODUCTIVITÉ
        prodPlanifierOrganiser: 'PLUTOT_EN_ACCORD',
        prodComprendreDirectives: 'PLUTOT_EN_ACCORD',
        prodRythmeSoutenu: 'PLUTOT_EN_ACCORD',
        prodEtablirPriorites: 'PLUTOT_EN_ACCORD',
        prodRespectEcheanciers: 'PLUTOT_EN_ACCORD',
        commentairesProductivite: '',

        // Section 2: QUALITÉ DU TRAVAIL
        qualRespectMandats: 'PLUTOT_EN_ACCORD',
        qualAttentionDetails: 'PLUTOT_EN_ACCORD',
        qualVerifierTravail: 'PLUTOT_EN_ACCORD',
        qualRechercherPerfectionnement: 'PLUTOT_EN_ACCORD',
        qualAnalyseProblemes: 'PLUTOT_EN_ACCORD',
        commentairesQualiteTravail: '',

        // Section 3: RELATIONS INTERPERSONNELLES
        relEtablirContacts: 'PLUTOT_EN_ACCORD',
        relContribuerEquipe: 'PLUTOT_EN_ACCORD',
        relAdapterCulture: 'PLUTOT_EN_ACCORD',
        relAccepterCritiques: 'PLUTOT_EN_ACCORD',
        relEtreRespectueux: 'PLUTOT_EN_ACCORD',
        relEcouteActive: 'PLUTOT_EN_ACCORD',
        commentairesRelations: '',

        // Section 4: HABILETÉS PERSONNELLES
        habInteretMotivation: 'PLUTOT_EN_ACCORD',
        habExprimerIdees: 'PLUTOT_EN_ACCORD',
        habFairePreuveInitiative: 'PLUTOT_EN_ACCORD',
        habTravaillerSecuritaire: 'PLUTOT_EN_ACCORD',
        habSensResponsabilites: 'PLUTOT_EN_ACCORD',
        habPonctuelAssidu: 'PLUTOT_EN_ACCORD',
        commentairesHabiletes: '',

        // Section 5: APPRÉCIATION GLOBALE
        appreciationGlobale: 'HABILETES_REPONDENT_PLEINEMENT_AUX_ATTENTES',
        precisionAppreciation: '',
        discussionAvecStagiaire: true,
        heuresEncadrementSemaine: 0,
        entrepriseAccueillirProchainStage: 'OUI',
        formationTechniqueSuffisante: ''
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfFilename, setPdfFilename] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);


    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }

        loadData();
    }, [navigate]);

    const loadData = async () => {
        await Promise.all([loadEntentes(), loadEvaluations()]);
    };

    const loadEntentes = async () => {
        try {
            setLoadingEntentes(true);
            setError('');
            const data = await employeurService.getEntentes();
            // Filtrer uniquement les ententes signées par les deux parties
            const ententesSignees = data.filter(
                e => e.etudiantSignature === 'SIGNEE'
                    && e.employeurSignature === 'SIGNEE'
                    && e.statut === 'SIGNEE'
            );
            setEntentes(ententesSignees);
        } catch (err: any) {
            console.error('Erreur lors du chargement des ententes:', err);
            setError(t('errors.loadEntentes'));
        } finally {
            setLoadingEntentes(false);
        }
    };

    const loadEvaluations = async () => {
        try {
            setLoadingEvaluations(true);
            const data = await employeurService.getEvaluations();
            setEvaluations(data);
        } catch (err: any) {
            console.error('Erreur lors du chargement des évaluations:', err);
            setError(t('errors.loadEvaluations'));
        } finally {
            setLoadingEvaluations(false);
        }
    };

    const isEntenteEvaluated = (ententeId: number): boolean => {
        return evaluations.some(evaluation => evaluation.ententeId === ententeId);
    };

    const handleOpenEvaluationModal = (entente: EntenteStageDTO) => {
        setSelectedEntente(entente);
        // Réinitialiser le formulaire avec des valeurs par défaut
        setFormData({
            nomSuperviseur: '',
            fonctionSuperviseur: '',
            telephoneSuperviseur: '',
            dateSignature: new Date().toISOString().split('T')[0],
            prodPlanifierOrganiser: 'PLUTOT_EN_ACCORD',
            prodComprendreDirectives: 'PLUTOT_EN_ACCORD',
            prodRythmeSoutenu: 'PLUTOT_EN_ACCORD',
            prodEtablirPriorites: 'PLUTOT_EN_ACCORD',
            prodRespectEcheanciers: 'PLUTOT_EN_ACCORD',
            commentairesProductivite: '',
            qualRespectMandats: 'PLUTOT_EN_ACCORD',
            qualAttentionDetails: 'PLUTOT_EN_ACCORD',
            qualVerifierTravail: 'PLUTOT_EN_ACCORD',
            qualRechercherPerfectionnement: 'PLUTOT_EN_ACCORD',
            qualAnalyseProblemes: 'PLUTOT_EN_ACCORD',
            commentairesQualiteTravail: '',
            relEtablirContacts: 'PLUTOT_EN_ACCORD',
            relContribuerEquipe: 'PLUTOT_EN_ACCORD',
            relAdapterCulture: 'PLUTOT_EN_ACCORD',
            relAccepterCritiques: 'PLUTOT_EN_ACCORD',
            relEtreRespectueux: 'PLUTOT_EN_ACCORD',
            relEcouteActive: 'PLUTOT_EN_ACCORD',
            commentairesRelations: '',
            habInteretMotivation: 'PLUTOT_EN_ACCORD',
            habExprimerIdees: 'PLUTOT_EN_ACCORD',
            habFairePreuveInitiative: 'PLUTOT_EN_ACCORD',
            habTravaillerSecuritaire: 'PLUTOT_EN_ACCORD',
            habSensResponsabilites: 'PLUTOT_EN_ACCORD',
            habPonctuelAssidu: 'PLUTOT_EN_ACCORD',
            commentairesHabiletes: '',
            appreciationGlobale: 'HABILETES_REPONDENT_PLEINEMENT_AUX_ATTENTES',
            precisionAppreciation: '',
            discussionAvecStagiaire: true,
            heuresEncadrementSemaine: 0,
            entrepriseAccueillirProchainStage: 'OUI',
            formationTechniqueSuffisante: ''
        });
        setFormErrors([]);
        setSuccessMessage('');
        setShowEvaluationModal(true);
    };

    const handleOpenDetailsModal = async (evaluation: EvaluationDTO) => {
        setSelectedEvaluation(evaluation);
        setShowDetailsModal(true);
    };

    const handleCloseModals = () => {
        setShowEvaluationModal(false);
        setShowDetailsModal(false);
        setSelectedEntente(null);
        setSelectedEvaluation(null);
        setFormErrors([]);
        setSuccessMessage('');
    };

    const validateForm = (): boolean => {
        const errors: string[] = [];

        // Validation informations superviseur
        if (!formData.nomSuperviseur.trim()) {
            errors.push(t('modal.supervisor.name'));
        }
        if (!formData.fonctionSuperviseur.trim()) {
            errors.push(t('modal.supervisor.function'));
        }
        if (!formData.telephoneSuperviseur.trim()) {
            errors.push(t('modal.supervisor.phone'));
        }

        // Validation commentaires (obligatoires)
        if (!formData.commentairesProductivite.trim()) {
            errors.push(t('modal.sections.productivity') + ' - ' + t('modal.fields.comments'));
        }
        if (!formData.commentairesQualiteTravail.trim()) {
            errors.push(t('modal.sections.workQuality') + ' - ' + t('modal.fields.comments'));
        }
        if (!formData.commentairesRelations.trim()) {
            errors.push(t('modal.sections.interpersonalSkills') + ' - ' + t('modal.fields.comments'));
        }
        if (!formData.commentairesHabiletes.trim()) {
            errors.push(t('modal.sections.personalSkills') + ' - ' + t('modal.fields.comments'));
        }

        // Validation appréciation globale
        if (!formData.precisionAppreciation.trim()) {
            errors.push(t('modal.globalAssessment.specifyAssessment'));
        }
        if (!formData.formationTechniqueSuffisante.trim()) {
            errors.push(t('modal.finalSection.technicalTraining'));
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !selectedEntente) {
            return;
        }

        try {
            setActionLoading(true);
            setFormErrors([]);

            const evaluationData: CreerEvaluationDTO = {
                ententeId: selectedEntente.id,
                etudiantId: selectedEntente.etudiantId,
                ...formData
            };

            await employeurService.creerEvaluation(evaluationData);

            setSuccessMessage(t('messages.success'));

            await loadEvaluations();

            setTimeout(() => {
                handleCloseModals();
            }, 2000);

        } catch (err: any) {
            console.error('Erreur lors de la soumission:', err);

            // Log l'erreur complète pour le debug
            console.error('Détails de l\'erreur:', {
                response: err.response,
                message: err.message,
                code: err.code
            });

            if (err.response?.data?.erreur) {
                const errorMessage = err.response.data.erreur.message || t('errors.submitFailed');
                const errorCode = err.response.data.erreur.errorCode;

                // Afficher le message d'erreur avec le code si disponible
                setFormErrors([errorCode ? `[${errorCode}] ${errorMessage}` : errorMessage]);
            } else if (err.code === 'ERR_NETWORK') {
                setFormErrors([t('errors.networkError')]);
            } else {
                setFormErrors([err.message || t('errors.submitFailed')]);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleGetPDF = async (evaluation: EvaluationDTO) => {
        try {
            setPdfLoading(true);
            // Révoquer l'ancienne URL si présente
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
                setPdfFilename(null);
            }

            const blob = await employeurService.getPdfEvaluation(evaluation.id!);
            const url = window.URL.createObjectURL(blob);
            const filename = `evaluation_${evaluation.id}_${new Date().toISOString().split('T')[0]}.pdf`;

            setPdfUrl(url);
            setPdfFilename(filename);
            setShowPdfModal(true);
        } catch (error) {
            console.error('Erreur lors de la récupération du PDF:', error);
            setFormErrors([t('errors.pdfDownloadFailed')]);
        } finally {
            setPdfLoading(false);
        }
    };

    const closePdfModal = () => {
        setShowPdfModal(false);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
            setPdfFilename(null);
        }
    };

    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-CA');
        } catch {
            return dateString;
        }
    };

    const ententesAEvaluer = ententes.filter(e => !isEntenteEvaluated(e.id));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="cursor-pointer mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {t('backToDashboard')}
                    </button>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                {t('title')}
                            </h1>
                            <p className="text-gray-600">{t('subtitle')}</p>
                        </div>

                        <button
                            onClick={loadData}
                            disabled={loadingEntentes || loadingEvaluations}
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${(loadingEntentes || loadingEvaluations) ? 'animate-spin' : ''}`} />
                            {t('refresh')}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-red-800">{error}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 flex gap-2 bg-white rounded-lg p-1 shadow">
                    <button
                        onClick={() => setActiveTab('toEvaluate')}
                        className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                            activeTab === 'toEvaluate'
                                ? 'cursor-pointer bg-blue-600 text-white shadow'
                                : 'cursor-pointer text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {t('tabs.toEvaluate')} ({ententesAEvaluer.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('evaluated')}
                        className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
                            activeTab === 'evaluated'
                                ? 'cursor-pointer bg-blue-600 text-white shadow'
                                : 'cursor-pointer text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {t('tabs.evaluated')} ({evaluations.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {activeTab === 'toEvaluate' ? (
                        // Ententes à évaluer
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {t('ententesList.title')}
                            </h2>

                            {loadingEntentes ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                                    <p className="text-gray-600">{t('loading')}</p>
                                </div>
                            ) : ententesAEvaluer.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        {t('ententesList.noEntentes')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {t('ententesList.noEntentesDescription')}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-6">
                                        {t('ententesList.count', { count: ententesAEvaluer.length })}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {ententesAEvaluer.map((entente) => (
                                            <div
                                                key={entente.id}
                                                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-blue-50"
                                                onClick={() => handleOpenEvaluationModal(entente)}
                                            >
                                                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('ententesList.student')}
                                                        </p>
                                                        <h3 className="font-bold text-gray-900 truncate">
                                                            {entente.etudiantNomComplet || 'N/A'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 truncate">
                                                            {entente.etudiantEmail || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {entente.titre}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <p className="text-sm text-gray-600">
                                                            {formatDate(entente.dateDebut)} {t('ententesList.to')} {formatDate(entente.dateFin)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEvaluationModal(entente);
                                                    }}
                                                >
                                                    <Star className="w-4 h-4" />
                                                    {t('ententesList.evaluate')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        // Évaluations soumises
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {t('evaluationsList.title')}
                            </h2>

                            {loadingEvaluations ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                                    <p className="text-gray-600">{t('loading')}</p>
                                </div>
                            ) : evaluations.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        {t('evaluationsList.noEvaluations')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {t('evaluationsList.noEvaluationsDescription')}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-6">
                                        {t('evaluationsList.count', { count: evaluations.length })}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {evaluations.map((evaluation) => {
                                            const entente = ententes.find(e => e.id === evaluation.ententeId);
                                            return (
                                                <div
                                                    key={evaluation.id}
                                                    className="border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-green-50"
                                                    onClick={() => handleOpenDetailsModal(evaluation)}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                                        <span className="text-xs text-gray-500">
                                                            {t('evaluationsList.evaluatedOn')} {formatDate(evaluation.dateEvaluation)}
                                                        </span>
                                                    </div>

                                                    {entente && (
                                                        <>
                                                            <h3 className="font-bold text-gray-900 mb-2">
                                                                {entente.etudiantNomComplet || 'N/A'}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 mb-4 truncate">
                                                                {entente.titre}
                                                            </p>
                                                        </>
                                                    )}

                                                    <button
                                                        className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDetailsModal(evaluation);
                                                        }}
                                                    >
                                                        {t('evaluationsList.viewDetails')}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal d'évaluation (CRÉATION) - FORMULAIRE COMPLET */}
            {showEvaluationModal && selectedEntente && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center rounded-t-2xl z-10">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {t('modal.title')}
                            </h2>
                            <button
                                onClick={handleCloseModals}
                                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="px-8 py-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                            {/* Success Message */}
                            {successMessage && (
                                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-green-800 font-semibold">{successMessage}</p>
                                        <p className="text-green-700 text-sm mt-1">{t('messages.successDescription')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Validation Errors */}
                            {formErrors.length > 0 && (
                                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-800 font-semibold mb-2">
                                                {t('errors.allFieldsRequired')}
                                            </p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {formErrors.map((error, idx) => (
                                                    <li key={idx} className="text-red-700 text-sm">{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Student Info */}
                            <div className="bg-blue-50 rounded-lg p-6 mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t('modal.studentInfo')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold">{t('modal.name')}:</span> {selectedEntente.etudiantNomComplet || 'N/A'}</p>
                                    <p><span className="font-semibold">{t('modal.email')}:</span> {selectedEntente.etudiantEmail || 'N/A'}</p>
                                    <p><span className="font-semibold">{t('modal.internshipTitle')}:</span> {selectedEntente.titre}</p>
                                    <p><span className="font-semibold">{t('modal.period')}:</span> {formatDate(selectedEntente.dateDebut)} {t('modal.to')} {formatDate(selectedEntente.dateFin)}</p>
                                </div>
                            </div>

                            {/* Evaluation Form */}
                            <form onSubmit={handleSubmitEvaluation} className="space-y-8">
                                {/* SECTION: Informations du superviseur */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        {t('modal.supervisor.title')}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.supervisor.name')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nomSuperviseur}
                                                onChange={(e) => setFormData({...formData, nomSuperviseur: e.target.value})}
                                                placeholder={t('modal.supervisor.namePlaceholder')}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.supervisor.function')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.fonctionSuperviseur}
                                                onChange={(e) => setFormData({...formData, fonctionSuperviseur: e.target.value})}
                                                placeholder={t('modal.supervisor.functionPlaceholder')}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.supervisor.phone')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.telephoneSuperviseur}
                                                onChange={(e) => setFormData({...formData, telephoneSuperviseur: e.target.value})}
                                                placeholder={t('modal.supervisor.phonePlaceholder')}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.supervisor.signatureDate')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.dateSignature}
                                                onChange={(e) => setFormData({...formData, dateSignature: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 1: PRODUCTIVITÉ */}
                                <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        {t('modal.sections.productivity')}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">{t('modal.sections.productivitySubtitle')}</p>

                                    <div className="space-y-4">
                                        <LikertRadio
                                            name="prodPlanifierOrganiser"
                                            value={formData.prodPlanifierOrganiser}
                                            onChange={(val) => setFormData({...formData, prodPlanifierOrganiser: val})}
                                            label={t('modal.productivity.planOrganize')}
                                            required
                                        />
                                        <LikertRadio
                                            name="prodComprendreDirectives"
                                            value={formData.prodComprendreDirectives}
                                            onChange={(val) => setFormData({...formData, prodComprendreDirectives: val})}
                                            label={t('modal.productivity.understandDirectives')}
                                            required
                                        />
                                        <LikertRadio
                                            name="prodRythmeSoutenu"
                                            value={formData.prodRythmeSoutenu}
                                            onChange={(val) => setFormData({...formData, prodRythmeSoutenu: val})}
                                            label={t('modal.productivity.sustainedPace')}
                                            required
                                        />
                                        <LikertRadio
                                            name="prodEtablirPriorites"
                                            value={formData.prodEtablirPriorites}
                                            onChange={(val) => setFormData({...formData, prodEtablirPriorites: val})}
                                            label={t('modal.productivity.setPriorities')}
                                            required
                                        />
                                        <LikertRadio
                                            name="prodRespectEcheanciers"
                                            value={formData.prodRespectEcheanciers}
                                            onChange={(val) => setFormData({...formData, prodRespectEcheanciers: val})}
                                            label={t('modal.productivity.respectDeadlines')}
                                            required
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.commentairesProductivite}
                                            onChange={(e) => setFormData({...formData, commentairesProductivite: e.target.value})}
                                            placeholder={t('modal.fields.commentsPlaceholder')}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* SECTION 2: QUALITÉ DU TRAVAIL */}
                                <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <ClipboardCheck className="w-5 h-5 text-green-600" />
                                        {t('modal.sections.workQuality')}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">{t('modal.sections.workQualitySubtitle')}</p>

                                    <div className="space-y-4">
                                        <LikertRadio
                                            name="qualRespectMandats"
                                            value={formData.qualRespectMandats}
                                            onChange={(val) => setFormData({...formData, qualRespectMandats: val})}
                                            label={t('modal.workQuality.respectMandates')}
                                            required
                                        />
                                        <LikertRadio
                                            name="qualAttentionDetails"
                                            value={formData.qualAttentionDetails}
                                            onChange={(val) => setFormData({...formData, qualAttentionDetails: val})}
                                            label={t('modal.workQuality.attentionToDetail')}
                                            required
                                        />
                                        <LikertRadio
                                            name="qualVerifierTravail"
                                            value={formData.qualVerifierTravail}
                                            onChange={(val) => setFormData({...formData, qualVerifierTravail: val})}
                                            label={t('modal.workQuality.verifyWork')}
                                            required
                                        />
                                        <LikertRadio
                                            name="qualRechercherPerfectionnement"
                                            value={formData.qualRechercherPerfectionnement}
                                            onChange={(val) => setFormData({...formData, qualRechercherPerfectionnement: val})}
                                            label={t('modal.workQuality.seekImprovement')}
                                            required
                                        />
                                        <LikertRadio
                                            name="qualAnalyseProblemes"
                                            value={formData.qualAnalyseProblemes}
                                            onChange={(val) => setFormData({...formData, qualAnalyseProblemes: val})}
                                            label={t('modal.workQuality.analyzeProblems')}
                                            required
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.commentairesQualiteTravail}
                                            onChange={(e) => setFormData({...formData, commentairesQualiteTravail: e.target.value})}
                                            placeholder={t('modal.fields.commentsPlaceholder')}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* SECTION 3: QUALITÉS DES RELATIONS INTERPERSONNELLES */}
                                <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-600" />
                                        {t('modal.sections.interpersonalSkills')}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">{t('modal.sections.interpersonalSkillsSubtitle')}</p>

                                    <div className="space-y-4">
                                        <LikertRadio
                                            name="relEtablirContacts"
                                            value={formData.relEtablirContacts}
                                            onChange={(val) => setFormData({...formData, relEtablirContacts: val})}
                                            label={t('modal.interpersonal.establishContacts')}
                                            required
                                        />
                                        <LikertRadio
                                            name="relContribuerEquipe"
                                            value={formData.relContribuerEquipe}
                                            onChange={(val) => setFormData({...formData, relContribuerEquipe: val})}
                                            label={t('modal.interpersonal.contributeTeam')}
                                            required
                                        />
                                        <LikertRadio
                                            name="relAdapterCulture"
                                            value={formData.relAdapterCulture}
                                            onChange={(val) => setFormData({...formData, relAdapterCulture: val})}
                                            label={t('modal.interpersonal.adaptCulture')}
                                            required
                                        />
                                        <LikertRadio
                                            name="relAccepterCritiques"
                                            value={formData.relAccepterCritiques}
                                            onChange={(val) => setFormData({...formData, relAccepterCritiques: val})}
                                            label={t('modal.interpersonal.acceptCriticism')}
                                            required
                                        />
                                        <LikertRadio
                                            name="relEtreRespectueux"
                                            value={formData.relEtreRespectueux}
                                            onChange={(val) => setFormData({...formData, relEtreRespectueux: val})}
                                            label={t('modal.interpersonal.beRespectful')}
                                            required
                                        />
                                        <LikertRadio
                                            name="relEcouteActive"
                                            value={formData.relEcouteActive}
                                            onChange={(val) => setFormData({...formData, relEcouteActive: val})}
                                            label={t('modal.interpersonal.activeListening')}
                                            required
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.commentairesRelations}
                                            onChange={(e) => setFormData({...formData, commentairesRelations: e.target.value})}
                                            placeholder={t('modal.fields.commentsPlaceholder')}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* SECTION 4: HABILETÉS PERSONNELLES */}
                                <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-orange-600" />
                                        {t('modal.sections.personalSkills')}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">{t('modal.sections.personalSkillsSubtitle')}</p>

                                    <div className="space-y-4">
                                        <LikertRadio
                                            name="habInteretMotivation"
                                            value={formData.habInteretMotivation}
                                            onChange={(val) => setFormData({...formData, habInteretMotivation: val})}
                                            label={t('modal.personalSkills.interestMotivation')}
                                            required
                                        />
                                        <LikertRadio
                                            name="habExprimerIdees"
                                            value={formData.habExprimerIdees}
                                            onChange={(val) => setFormData({...formData, habExprimerIdees: val})}
                                            label={t('modal.personalSkills.expressIdeas')}
                                            required
                                        />
                                        <LikertRadio
                                            name="habFairePreuveInitiative"
                                            value={formData.habFairePreuveInitiative}
                                            onChange={(val) => setFormData({...formData, habFairePreuveInitiative: val})}
                                            label={t('modal.personalSkills.showInitiative')}
                                            required
                                        />
                                        <LikertRadio
                                            name="habTravaillerSecuritaire"
                                            value={formData.habTravaillerSecuritaire}
                                            onChange={(val) => setFormData({...formData, habTravaillerSecuritaire: val})}
                                            label={t('modal.personalSkills.workSafely')}
                                            required
                                        />
                                        <LikertRadio
                                            name="habSensResponsabilites"
                                            value={formData.habSensResponsabilites}
                                            onChange={(val) => setFormData({...formData, habSensResponsabilites: val})}
                                            label={t('modal.personalSkills.senseResponsibility')}
                                            required
                                        />
                                        <LikertRadio
                                            name="habPonctuelAssidu"
                                            value={formData.habPonctuelAssidu}
                                            onChange={(val) => setFormData({...formData, habPonctuelAssidu: val})}
                                            label={t('modal.personalSkills.punctualDiligent')}
                                            required
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.commentairesHabiletes}
                                            onChange={(e) => setFormData({...formData, commentairesHabiletes: e.target.value})}
                                            placeholder={t('modal.fields.commentsPlaceholder')}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* SECTION 5: APPRÉCIATION GLOBALE */}
                                <div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-indigo-600" />
                                        {t('modal.globalAssessment.title')}
                                    </h3>

                                    <div className="space-y-3 mb-4">
                                        {[
                                            { value: 'HABILETES_DEPASSENT_DE_BEAUCOUP_LES_ATTENTES', labelKey: 'exceedExpectationsGreatly' },
                                            { value: 'HABILETES_DEPASSENT_LES_ATTENTES', labelKey: 'exceedExpectations' },
                                            { value: 'HABILETES_REPONDENT_PLEINEMENT_AUX_ATTENTES', labelKey: 'fullyMeetExpectations' },
                                            { value: 'HABILETES_REPONDENT_PARTIELLEMENT_AUX_ATTENTES', labelKey: 'partiallyMeetExpectations' },
                                            { value: 'HABILETES_NE_REPONDENT_PAS_AUX_ATTENTES', labelKey: 'doNotMeetExpectations' }
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                    formData.appreciationGlobale === option.value
                                                        ? 'border-indigo-500 bg-indigo-100'
                                                        : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="appreciationGlobale"
                                                    value={option.value}
                                                    checked={formData.appreciationGlobale === option.value}
                                                    onChange={(e) => setFormData({...formData, appreciationGlobale: e.target.value as AppreciationGlobale})}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="ml-3 text-sm font-medium text-gray-700">
                                                    {t(`modal.globalAssessment.${option.labelKey}`)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('modal.globalAssessment.specifyAssessment')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.precisionAppreciation}
                                            onChange={(e) => setFormData({...formData, precisionAppreciation: e.target.value})}
                                            placeholder={t('modal.globalAssessment.specifyAssessmentPlaceholder')}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* SECTION 6: FINALISATION */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                                        {t('modal.finalSection.title')}
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Discussion avec stagiaire */}
                                        <div>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.discussionAvecStagiaire}
                                                    onChange={(e) => setFormData({...formData, discussionAvecStagiaire: e.target.checked})}
                                                    className="w-5 h-5 text-blue-600 rounded"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {t('modal.finalSection.discussedWithIntern')}
                                                </span>
                                            </label>
                                        </div>

                                        {/* Heures d'encadrement */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.finalSection.supervisionHours')}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.heuresEncadrementSemaine}
                                                onChange={(e) => setFormData({...formData, heuresEncadrementSemaine: parseInt(e.target.value) || 0})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Entreprise accueillir prochain stage */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.finalSection.welcomeNextInternship')}
                                            </label>
                                            <div className="flex gap-4">
                                                {[
                                                    { value: 'OUI', labelKey: 'yes' },
                                                    { value: 'NON', labelKey: 'no' },
                                                    { value: 'PEUT_ETRE', labelKey: 'maybe' }
                                                ].map((option) => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                            formData.entrepriseAccueillirProchainStage === option.value
                                                                ? 'border-blue-500 bg-blue-100'
                                                                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="entrepriseAccueillirProchainStage"
                                                            value={option.value}
                                                            checked={formData.entrepriseAccueillirProchainStage === option.value}
                                                            onChange={(e) => setFormData({...formData, entrepriseAccueillirProchainStage: e.target.value as EntrepriseProchainStageChoix})}
                                                            className="sr-only"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {t(`modal.finalSection.${option.labelKey}`)}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Formation technique suffisante */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('modal.finalSection.technicalTraining')} <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={formData.formationTechniqueSuffisante}
                                                onChange={(e) => setFormData({...formData, formationTechniqueSuffisante: e.target.value})}
                                                placeholder={t('modal.finalSection.technicalTrainingPlaceholder')}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseModals}
                                        disabled={actionLoading}
                                        className="cursor-pointer flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {t('modal.actions.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="cursor-pointer flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                {t('modal.actions.submitting')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {t('modal.actions.submit')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails d'évaluation (VISUALISATION PDF) */}
            {showDetailsModal && selectedEvaluation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {t('detailsModal.title')}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCloseModals}
                                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="bg-green-50 rounded-lg p-4 mb-6 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">{t('detailsModal.evaluationDate')}</p>
                                    <p className="font-semibold text-gray-900">{formatDate(selectedEvaluation.dateEvaluation)}</p>
                                </div>
                            </div>

                            {(() => {
                                const entente = ententes.find(e => e.id === selectedEvaluation.ententeId);
                                return entente ? (
                                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-600" />
                                            {t('detailsModal.studentInfo')}
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-semibold">{t('modal.name')}:</span> {entente.etudiantNomComplet || 'N/A'}</p>
                                            <p><span className="font-semibold">{t('modal.email')}:</span> {entente.etudiantEmail || 'N/A'}</p>
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t('detailsModal.internshipInfo')}</p>
                                                <p className="font-semibold">{entente.titre}</p>
                                                <p className="text-gray-600">{formatDate(entente.dateDebut)} {t('modal.to')} {formatDate(entente.dateFin)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            <div className="bg-gray-100 rounded-lg p-4 text-center">
                                <p className="text-gray-700 mb-4">{t('detailsModal.pdfInfo')}</p>
                                <button
                                    onClick={() => handleGetPDF(selectedEvaluation)}
                                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    <Eye className="w-5 h-5" />
                                    {t('detailsModal.viewPDF')}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-8 py-4 flex-shrink-0">
                            <button
                                onClick={handleCloseModals}
                                className="cursor-pointer w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                            >
                                {t('detailsModal.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showPdfModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                            <h3 className="text-xl font-semibold">
                                {t('detailsModal.previewTitle') /* ou texte souhaité */}
                            </h3>
                            <div className="flex items-center gap-3">
                                {pdfLoading ? (
                                    <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                ) : (
                                    <button onClick={closePdfModal} className="cursor-pointer text-white hover:text-gray-200">
                                        <X className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-[600px] border rounded"
                                    title="PDF Preview"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">{t('detailsModal.noPdfPreview')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t flex items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                {pdfFilename ?? ''}
                            </div>

                            <div className="flex items-center gap-2">
                                {pdfUrl && pdfFilename && (
                                    <a
                                        href={pdfUrl}
                                        download={pdfFilename}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    >
                                        {t('detailsModal.downloadPdf')}
                                    </a>
                                )}
                                <button
                                    onClick={closePdfModal}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                                >
                                    {t('detailsModal.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeurEvaluationStagiaire;