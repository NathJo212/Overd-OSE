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
    TrendingUp,
    Eye,
    ChevronRight,
    ChevronLeft
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
// Local form type allowing null before user selects values
interface LocalEvaluationForm {
    nomSuperviseur: string;
    fonctionSuperviseur: string;
    telephoneSuperviseur: string;
    dateSignature: string;
    prodPlanifierOrganiser: NiveauAccord | null;
    prodComprendreDirectives: NiveauAccord | null;
    prodRythmeSoutenu: NiveauAccord | null;
    prodEtablirPriorites: NiveauAccord | null;
    prodRespectEcheanciers: NiveauAccord | null;
    commentairesProductivite: string;
    qualRespectMandats: NiveauAccord | null;
    qualAttentionDetails: NiveauAccord | null;
    qualVerifierTravail: NiveauAccord | null;
    qualRechercherPerfectionnement: NiveauAccord | null;
    qualAnalyseProblemes: NiveauAccord | null;
    commentairesQualiteTravail: string;
    relEtablirContacts: NiveauAccord | null;
    relContribuerEquipe: NiveauAccord | null;
    relAdapterCulture: NiveauAccord | null;
    relAccepterCritiques: NiveauAccord | null;
    relEtreRespectueux: NiveauAccord | null;
    relEcouteActive: NiveauAccord | null;
    commentairesRelations: string;
    habInteretMotivation: NiveauAccord | null;
    habExprimerIdees: NiveauAccord | null;
    habFairePreuveInitiative: NiveauAccord | null;
    habTravaillerSecuritaire: NiveauAccord | null;
    habSensResponsabilites: NiveauAccord | null;
    habPonctuelAssidu: NiveauAccord | null;
    commentairesHabiletes: string;
    appreciationGlobale: AppreciationGlobale | null;
    precisionAppreciation: string;
    discussionAvecStagiaire: boolean;
    heuresEncadrementSemaine: number;
    entrepriseAccueillirProchainStage: EntrepriseProchainStageChoix | null;
    formationTechniqueSuffisante: string;
}

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

    const options: { value: NiveauAccord; labelKey: string; colorClass: string; bgClass: string }[] = [
        {
            value: 'TOTALEMENT_EN_ACCORD',
            labelKey: 'likertScale.totallyAgree',
            colorClass: 'border-green-500 ring-green-500',
            bgClass: 'bg-green-50'
        },
        {
            value: 'PLUTOT_EN_ACCORD',
            labelKey: 'likertScale.agree',
            colorClass: 'border-blue-500 ring-blue-500',
            bgClass: 'bg-blue-50'
        },
        {
            value: 'PLUTOT_EN_DESACCORD',
            labelKey: 'likertScale.disagree',
            colorClass: 'border-yellow-500 ring-yellow-500',
            bgClass: 'bg-yellow-50'
        },
        {
            value: 'TOTALEMENT_EN_DESACCORD',
            labelKey: 'likertScale.totallyDisagree',
            colorClass: 'border-red-500 ring-red-500',
            bgClass: 'bg-red-50'
        },
        {
            value: 'NON_APPLICABLE',
            labelKey: 'likertScale.notApplicable',
            colorClass: 'border-gray-500 ring-gray-500',
            bgClass: 'bg-gray-50'
        }
    ];

    return (
        <div className="mb-6">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100 mb-3 flex items-start">
                <span className="mr-2">•</span>
                <span>{label}</span>
                {required && <span className="text-red-500 ml-1">*</span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`relative flex items-center justify-center cursor-pointer border-2 rounded-lg p-3 transition-all ${
                            value === option.value
                                ? `${option.colorClass} ${option.bgClass} ring-2 ring-offset-2 dark:ring-offset-slate-800`
                                : 'border-gray-200 hover:border-gray-300 bg-white dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-800'
                        }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            className="sr-only"
                        />
                        <span className={`text-xs font-medium text-center ${
                            value === option.value ? 'text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-300'
                        }`}>
                            {t(option.labelKey)}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

// Stepper pour le wizard
interface StepperProps {
    steps: { label: string; icon: React.ReactNode }[];
    currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all shadow-md ${
                            index < currentStep
                                ? 'bg-green-500 text-white'
                                : index === currentStep
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                                    : 'bg-gray-200 text-gray-500'
                        }`}>
                            {index < currentStep ? <CheckCircle className="w-6 h-6" /> : step.icon}
                        </div>
                        <span className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                            index === currentStep ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                            index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                    )}
                </div>
            ))}
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

    // Wizard state
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        { label: 'Superviseur', icon: <User className="w-6 h-6" /> },
        { label: 'Productivité', icon: <TrendingUp className="w-6 h-6" /> },
        { label: 'Qualité', icon: <ClipboardCheck className="w-6 h-6" /> },
        { label: 'Relations', icon: <Users className="w-6 h-6" /> },
        { label: 'Habiletés', icon: <Lightbulb className="w-6 h-6" /> },
        { label: 'Global', icon: <Star className="w-6 h-6" /> }
    ];

    // Form data
    // @ts-ignore
    const [formData, setFormData] = useState<LocalEvaluationForm>({
        nomSuperviseur: '',
        fonctionSuperviseur: '',
        telephoneSuperviseur: '',
        dateSignature: new Date().toISOString().split('T')[0],
        prodPlanifierOrganiser: null,
        prodComprendreDirectives: null,
        prodRythmeSoutenu: null,
        prodEtablirPriorites: null,
        prodRespectEcheanciers: null,
        commentairesProductivite: '',
        qualRespectMandats: null,
        qualAttentionDetails: null,
        qualVerifierTravail: null,
        qualRechercherPerfectionnement: null,
        qualAnalyseProblemes: null,
        commentairesQualiteTravail: '',
        relEtablirContacts: null,
        relContribuerEquipe: null,
        relAdapterCulture: null,
        relAccepterCritiques: null,
        relEtreRespectueux: null,
        relEcouteActive: null,
        commentairesRelations: '',
        habInteretMotivation: null,
        habExprimerIdees: null,
        habFairePreuveInitiative: null,
        habTravaillerSecuritaire: null,
        habSensResponsabilites: null,
        habPonctuelAssidu: null,
        commentairesHabiletes: '',
        appreciationGlobale: null,
        precisionAppreciation: '',
        discussionAvecStagiaire: false,
        heuresEncadrementSemaine: 0,
        entrepriseAccueillirProchainStage: null,
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
        loadData().then();
    }, [navigate]);

    // Bloquer le scroll du body quand un modal est ouverte
    useEffect(() => {
        if (showEvaluationModal || showDetailsModal || showPdfModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showEvaluationModal, showDetailsModal, showPdfModal]);

    const loadData = async () => {
        await Promise.all([loadEntentes(), loadEvaluations()]);
    };

    const loadEntentes = async () => {
        try {
            setLoadingEntentes(true);
            setError('');
            const data = await employeurService.getEntentes();
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
        setCurrentStep(0);
        setFormData({
            nomSuperviseur: '',
            fonctionSuperviseur: '',
            telephoneSuperviseur: '',
            dateSignature: new Date().toISOString().split('T')[0],
            prodPlanifierOrganiser: null,
            prodComprendreDirectives: null,
            prodRythmeSoutenu: null,
            prodEtablirPriorites: null,
            prodRespectEcheanciers: null,
            commentairesProductivite: '',
            qualRespectMandats: null,
            qualAttentionDetails: null,
            qualVerifierTravail: null,
            qualRechercherPerfectionnement: null,
            qualAnalyseProblemes: null,
            commentairesQualiteTravail: '',
            relEtablirContacts: null,
            relContribuerEquipe: null,
            relAdapterCulture: null,
            relAccepterCritiques: null,
            relEtreRespectueux: null,
            relEcouteActive: null,
            commentairesRelations: '',
            habInteretMotivation: null,
            habExprimerIdees: null,
            habFairePreuveInitiative: null,
            habTravaillerSecuritaire: null,
            habSensResponsabilites: null,
            habPonctuelAssidu: null,
            commentairesHabiletes: '',
            appreciationGlobale: null,
            precisionAppreciation: '',
            discussionAvecStagiaire: false,
            heuresEncadrementSemaine: 0,
            entrepriseAccueillirProchainStage: null,
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
        setCurrentStep(0);
    };

    const validateStep = (step: number): boolean => {
        const errors: string[] = [];

        switch (step) {
            case 0: // Superviseur
                if (!formData.nomSuperviseur.trim()) errors.push(t('modal.supervisor.name'));
                if (!formData.fonctionSuperviseur.trim()) errors.push(t('modal.supervisor.function'));
                if (!formData.telephoneSuperviseur.trim()) errors.push(t('modal.supervisor.phone'));
                break;
            case 1: // Productivité
                if (!formData.prodPlanifierOrganiser) errors.push(t('modal.productivity.planOrganize'));
                if (!formData.prodComprendreDirectives) errors.push(t('modal.productivity.understandDirectives'));
                if (!formData.prodRythmeSoutenu) errors.push(t('modal.productivity.sustainedPace'));
                if (!formData.prodEtablirPriorites) errors.push(t('modal.productivity.setPriorities'));
                if (!formData.prodRespectEcheanciers) errors.push(t('modal.productivity.respectDeadlines'));
                if (!formData.commentairesProductivite.trim()) errors.push(t('modal.fields.comments'));
                break;
            case 2: // Qualité
                if (!formData.qualRespectMandats) errors.push(t('modal.workQuality.respectMandates'));
                if (!formData.qualAttentionDetails) errors.push(t('modal.workQuality.attentionToDetail'));
                if (!formData.qualVerifierTravail) errors.push(t('modal.workQuality.verifyWork'));
                if (!formData.qualRechercherPerfectionnement) errors.push(t('modal.workQuality.seekImprovement'));
                if (!formData.qualAnalyseProblemes) errors.push(t('modal.workQuality.analyzeProblems'));
                if (!formData.commentairesQualiteTravail.trim()) errors.push(t('modal.fields.comments'));
                break;
            case 3: // Relations
                if (!formData.relEtablirContacts) errors.push(t('modal.interpersonal.establishContacts'));
                if (!formData.relContribuerEquipe) errors.push(t('modal.interpersonal.contributeTeam'));
                if (!formData.relAdapterCulture) errors.push(t('modal.interpersonal.adaptCulture'));
                if (!formData.relAccepterCritiques) errors.push(t('modal.interpersonal.acceptCriticism'));
                if (!formData.relEtreRespectueux) errors.push(t('modal.interpersonal.beRespectful'));
                if (!formData.relEcouteActive) errors.push(t('modal.interpersonal.activeListening'));
                if (!formData.commentairesRelations.trim()) errors.push(t('modal.fields.comments'));
                break;
            case 4: // Habiletés
                if (!formData.habInteretMotivation) errors.push(t('modal.personalSkills.interestMotivation'));
                if (!formData.habExprimerIdees) errors.push(t('modal.personalSkills.expressIdeas'));
                if (!formData.habFairePreuveInitiative) errors.push(t('modal.personalSkills.showInitiative'));
                if (!formData.habTravaillerSecuritaire) errors.push(t('modal.personalSkills.workSafely'));
                if (!formData.habSensResponsabilites) errors.push(t('modal.personalSkills.senseResponsibility'));
                if (!formData.habPonctuelAssidu) errors.push(t('modal.personalSkills.punctualDiligent'));
                if (!formData.commentairesHabiletes.trim()) errors.push(t('modal.fields.comments'));
                break;
            case 5: // Appréciation globale
                if (!formData.appreciationGlobale) errors.push(t('modal.globalAssessment.title'));
                if (!formData.precisionAppreciation.trim()) errors.push(t('modal.globalAssessment.specifyAssessment'));
                if (!formData.entrepriseAccueillirProchainStage) errors.push(t('modal.finalSection.welcomeNextInternship'));
                if (!formData.formationTechniqueSuffisante.trim()) errors.push(t('modal.finalSection.technicalTraining'));
                break;
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
            setFormErrors([]);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        setFormErrors([]);
    };

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep(currentStep) || !selectedEntente) {
            return;
        }

        try {
            setActionLoading(true);
            setFormErrors([]);

            // Cast after validation (all nullable fields should be non-null now)
            const evaluationData: CreerEvaluationDTO = {
                ententeId: selectedEntente.id,
                etudiantId: selectedEntente.etudiantId,
                nomSuperviseur: formData.nomSuperviseur,
                fonctionSuperviseur: formData.fonctionSuperviseur,
                telephoneSuperviseur: formData.telephoneSuperviseur,
                dateSignature: formData.dateSignature,
                prodPlanifierOrganiser: formData.prodPlanifierOrganiser!,
                prodComprendreDirectives: formData.prodComprendreDirectives!,
                prodRythmeSoutenu: formData.prodRythmeSoutenu!,
                prodEtablirPriorites: formData.prodEtablirPriorites!,
                prodRespectEcheanciers: formData.prodRespectEcheanciers!,
                commentairesProductivite: formData.commentairesProductivite,
                qualRespectMandats: formData.qualRespectMandats!,
                qualAttentionDetails: formData.qualAttentionDetails!,
                qualVerifierTravail: formData.qualVerifierTravail!,
                qualRechercherPerfectionnement: formData.qualRechercherPerfectionnement!,
                qualAnalyseProblemes: formData.qualAnalyseProblemes!,
                commentairesQualiteTravail: formData.commentairesQualiteTravail,
                relEtablirContacts: formData.relEtablirContacts!,
                relContribuerEquipe: formData.relContribuerEquipe!,
                relAdapterCulture: formData.relAdapterCulture!,
                relAccepterCritiques: formData.relAccepterCritiques!,
                relEtreRespectueux: formData.relEtreRespectueux!,
                relEcouteActive: formData.relEcouteActive!,
                commentairesRelations: formData.commentairesRelations,
                habInteretMotivation: formData.habInteretMotivation!,
                habExprimerIdees: formData.habExprimerIdees!,
                habFairePreuveInitiative: formData.habFairePreuveInitiative!,
                habTravaillerSecuritaire: formData.habTravaillerSecuritaire!,
                habSensResponsabilites: formData.habSensResponsabilites!,
                habPonctuelAssidu: formData.habPonctuelAssidu!,
                commentairesHabiletes: formData.commentairesHabiletes,
                appreciationGlobale: formData.appreciationGlobale!,
                precisionAppreciation: formData.precisionAppreciation,
                discussionAvecStagiaire: formData.discussionAvecStagiaire,
                heuresEncadrementSemaine: formData.heuresEncadrementSemaine,
                entrepriseAccueillirProchainStage: formData.entrepriseAccueillirProchainStage!,
                formationTechniqueSuffisante: formData.formationTechniqueSuffisante
            };

            await employeurService.creerEvaluation(evaluationData);
            setSuccessMessage(t('messages.success'));
            await loadEvaluations();

            setTimeout(() => {
                handleCloseModals();
            }, 2000);

        } catch (err: any) {
            console.error('Erreur lors de la soumission:', err);

            if (err.response?.data?.erreur) {
                const errorMessage = err.response.data.erreur.message || t('errors.submitFailed');
                const errorCode = err.response.data.erreur.errorCode;
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

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Superviseur
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-2xl p-8 border-2 border-blue-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('modal.supervisor.title')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">Informations sur le superviseur du stage</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 rounded-xl p-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.supervisor.name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nomSuperviseur}
                                        onChange={(e) => setFormData({...formData, nomSuperviseur: e.target.value})}
                                        placeholder={t('modal.supervisor.namePlaceholder')}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.supervisor.function')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fonctionSuperviseur}
                                        onChange={(e) => setFormData({...formData, fonctionSuperviseur: e.target.value})}
                                        placeholder={t('modal.supervisor.functionPlaceholder')}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.supervisor.phone')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.telephoneSuperviseur}
                                        onChange={(e) => setFormData({...formData, telephoneSuperviseur: e.target.value})}
                                        placeholder={t('modal.supervisor.phonePlaceholder')}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.supervisor.signatureDate')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateSignature}
                                        onChange={(e) => setFormData({...formData, dateSignature: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 1: // Productivité
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-2xl p-8 border-2 border-blue-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('modal.sections.productivity')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.sections.productivitySubtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-6 bg-white dark:bg-slate-800 rounded-xl p-6">
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

                                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-slate-700">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.commentairesProductivite}
                                        onChange={(e) => setFormData({...formData, commentairesProductivite: e.target.value})}
                                        placeholder={t('modal.fields.commentsPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2: // Qualité du travail
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-2xl p-8 border-2 border-green-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <ClipboardCheck className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('modal.sections.workQuality')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.sections.workQualitySubtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-6 bg-white dark:bg-slate-800 rounded-xl p-6">
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

                                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-slate-700">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.commentairesQualiteTravail}
                                        onChange={(e) => setFormData({...formData, commentairesQualiteTravail: e.target.value})}
                                        placeholder={t('modal.fields.commentsPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3: // Relations interpersonnelles
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-2xl p-8 border-2 border-purple-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('modal.sections.interpersonalSkills')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.sections.interpersonalSkillsSubtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-6 bg-white dark:bg-slate-800 rounded-xl p-6">
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

                                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-slate-700">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.commentairesRelations}
                                        onChange={(e) => setFormData({...formData, commentairesRelations: e.target.value})}
                                        placeholder={t('modal.fields.commentsPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Habiletés personnelles
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-2xl p-8 border-2 border-orange-200 dark:border-slate-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Lightbulb className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('modal.sections.personalSkills')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('modal.sections.personalSkillsSubtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-6 bg-white dark:bg-slate-800 rounded-xl p-6">
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

                                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-slate-700">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.fields.comments')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.commentairesHabiletes}
                                        onChange={(e) => setFormData({...formData, commentairesHabiletes: e.target.value})}
                                        placeholder={t('modal.fields.commentsPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 5: // Appréciation globale
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="rounded-2xl p-8 border-2 border-indigo-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Star className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('modal.globalAssessment.title')}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">Évaluation globale et commentaires finaux</p>
                                </div>
                            </div>

                            <div className="space-y-6 bg-white dark:bg-slate-800 rounded-xl p-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-4">
                                        {t('modal.globalAssessment.title')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'HABILETES_DEPASSENT_DE_BEAUCOUP_LES_ATTENTES', labelKey: 'exceedExpectationsGreatly', color: 'green' },
                                            { value: 'HABILETES_DEPASSENT_LES_ATTENTES', labelKey: 'exceedExpectations', color: 'blue' },
                                            { value: 'HABILETES_REPONDENT_PLEINEMENT_AUX_ATTENTES', labelKey: 'fullyMeetExpectations', color: 'indigo' },
                                            { value: 'HABILETES_REPONDENT_PARTIELLEMENT_AUX_ATTENTES', labelKey: 'partiallyMeetExpectations', color: 'yellow' },
                                            { value: 'HABILETES_NE_REPONDENT_PAS_AUX_ATTENTES', labelKey: 'doNotMeetExpectations', color: 'red' }
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                    formData.appreciationGlobale === option.value
                                                        ? `border-${option.color}-500 bg-${option.color}-50 shadow-md`
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="appreciationGlobale"
                                                    value={option.value}
                                                    checked={formData.appreciationGlobale === option.value}
                                                    onChange={(e) => setFormData({...formData, appreciationGlobale: e.target.value as AppreciationGlobale})}
                                                    className="w-5 h-5 text-indigo-600"
                                                />
                                                <span className="ml-3 text-sm font-semibold text-gray-800 dark:text-slate-200">
                                                    {t(`modal.globalAssessment.${option.labelKey}`)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                        {t('modal.globalAssessment.specifyAssessment')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.precisionAppreciation}
                                        onChange={(e) => setFormData({...formData, precisionAppreciation: e.target.value})}
                                        placeholder={t('modal.globalAssessment.specifyAssessmentPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                    />
                                </div>

                                <div className="pt-6 border-t-2 border-gray-200 dark:border-slate-700">
                                    <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-4 text-lg">{t('modal.finalSection.title')}</h4>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.discussionAvecStagiaire}
                                                    onChange={(e) => setFormData({...formData, discussionAvecStagiaire: e.target.checked})}
                                                    className="w-6 h-6 text-blue-600 rounded"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                                                    {t('modal.finalSection.discussedWithIntern')}
                                                </span>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                                {t('modal.finalSection.supervisionHours')}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.heuresEncadrementSemaine}
                                                onChange={(e) => setFormData({...formData, heuresEncadrementSemaine: parseInt(e.target.value) || 0})}
                                                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                                {t('modal.finalSection.welcomeNextInternship')} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { value: 'OUI', labelKey: 'yes', color: 'green', emoji: '✓' },
                                                    { value: 'PEUT_ETRE', labelKey: 'maybe', color: 'yellow', emoji: '?' },
                                                    { value: 'NON', labelKey: 'no', color: 'red', emoji: '✗' }
                                                ].map((option) => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                            formData.entrepriseAccueillirProchainStage === option.value
                                                                ? `border-${option.color}-500 bg-${option.color}-50 shadow-md`
                                                                : 'border-gray-200 hover:border-gray-300'
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
                                                        <span className="text-2xl mb-2">{option.emoji}</span>
                                                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                                                            {t(`modal.finalSection.${option.labelKey}`)}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                                                {t('modal.finalSection.technicalTraining')} <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={formData.formationTechniqueSuffisante}
                                                onChange={(e) => setFormData({...formData, formationTechniqueSuffisante: e.target.value})}
                                                placeholder={t('modal.finalSection.technicalTrainingPlaceholder')}
                                                rows={3}
                                                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="cursor-pointer mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        {t('backToDashboard')}
                    </button>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                {t('title')}
                            </h1>
                            <p className="text-gray-600 dark:text-slate-300">{t('subtitle')}</p>
                        </div>

                        <button
                            onClick={loadData}
                            disabled={loadingEntentes || loadingEvaluations}
                            className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 border border-gray-200 dark:border-slate-700 group"
                        >
                            <RefreshCw className={`w-5 h-5 ${(loadingEntentes || loadingEvaluations) ? 'animate-spin text-blue-600' : 'text-gray-600 dark:text-slate-300 group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span className="font-medium text-gray-700 dark:text-slate-200">{t('refresh')}</span>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-900/40 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-lg">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setActiveTab('toEvaluate')}
                            className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                                activeTab === 'toEvaluate'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Star className="w-5 h-5" />
                                <span>{t('tabs.toEvaluate')}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === 'toEvaluate' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {ententesAEvaluer.length}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('evaluated')}
                            className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                                activeTab === 'evaluated'
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>{t('tabs.evaluated')}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === 'evaluated' ? 'bg-white/20' : 'bg-green-100 text-green-600'
                                }`}>
                                    {evaluations.length}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'toEvaluate' ? (
                    // Ententes à évaluer
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 animate-fade-in">
                        {loadingEntentes ? (
                            <div className="text-center py-20">
                                <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-slate-300 font-medium">{t('loading')}</p>
                            </div>
                        ) : ententesAEvaluer.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-12 h-12 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-3">
                                    {t('ententesList.noEntentes')}
                                </h3>
                                <p className="text-gray-600 dark:text-slate-300 max-w-md mx-auto">
                                    {t('ententesList.noEntentesDescription')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                                        {t('ententesList.title')}
                                    </h2>
                                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                        {t('ententesList.count', { count: ententesAEvaluer.length })}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ententesAEvaluer.map((entente) => (
                                        <div
                                            key={entente.id}
                                            className="group border-2 border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100 transition-all cursor-pointer bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800 relative overflow-hidden transform hover:-translate-y-1"
                                            onClick={() => handleOpenEvaluationModal(entente)}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />

                                            <div className="relative">
                                                <div className="flex items-start gap-4 mb-6">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                                        <User className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                                            {t('ententesList.student')}
                                                        </p>
                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 truncate mb-1">
                                                            {entente.etudiantNomComplet || 'N/A'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-slate-300 truncate">
                                                            {entente.etudiantEmail || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                                        <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                                            {entente.titre}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <p className="text-sm text-gray-600 dark:text-slate-300">
                                                            {formatDate(entente.dateDebut)} → {formatDate(entente.dateFin)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    className="cursor-pointer w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEvaluationModal(entente);
                                                    }}
                                                >
                                                    <Star className="w-5 h-5" />
                                                    {t('ententesList.evaluate')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // Évaluations soumises
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 animate-fade-in">
                        {loadingEvaluations ? (
                            <div className="text-center py-20">
                                <RefreshCw className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-slate-300 font-medium">{t('loading')}</p>
                            </div>
                        ) : evaluations.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-3">
                                    {t('evaluationsList.noEvaluations')}
                                </h3>
                                <p className="text-gray-600 dark:text-slate-300 max-w-md mx-auto">
                                    {t('evaluationsList.noEvaluationsDescription')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                                        {t('evaluationsList.title')}
                                    </h2>
                                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                        {t('evaluationsList.count', { count: evaluations.length })}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {evaluations.map((evaluation) => {
                                        const entente = ententes.find(e => e.id === evaluation.ententeId);
                                        return (
                                            <div
                                                key={evaluation.id}
                                                className="group border-2 border-green-200 dark:border-green-900/40 rounded-2xl p-6 hover:border-green-400 hover:shadow-2xl hover:shadow-green-100 transition-all cursor-pointer bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-slate-800 relative overflow-hidden transform hover:-translate-y-1"
                                                onClick={() => handleOpenDetailsModal(evaluation).then()}
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors" />

                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                                            <CheckCircle className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                            {formatDate(evaluation.dateEvaluation)}
                                                        </div>
                                                    </div>

                                                    {entente && (
                                                        <>
                                                            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-2">
                                                                {entente.etudiantNomComplet || 'N/A'}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6 line-clamp-2">
                                                                {entente.titre}
                                                            </p>
                                                        </>
                                                    )}

                                                    <button
                                                        className="cursor-pointer w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDetailsModal(evaluation).then();
                                                        }}
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                        {t('evaluationsList.viewDetails')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modal d'évaluation (WIZARD MULTI-ÉTAPES) */}
            {showEvaluationModal && selectedEntente && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
                        {/* Header fixe */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {t('modal.title')}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {selectedEntente.etudiantNomComplet}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModals}
                                className="cursor-pointer text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Stepper */}
                        <div className="px-8 pt-6 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
                            <Stepper steps={steps} currentStep={currentStep} />
                        </div>

                        {/* Content scrollable */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50 dark:bg-slate-900">
                            {/* Success Message */}
                            {successMessage && (
                                <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-900/40 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-green-800 dark:text-green-200 font-semibold">{successMessage}</p>
                                        <p className="text-green-700 dark:text-green-300 text-sm mt-1">{t('messages.successDescription')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Validation Errors */}
                            {formErrors.length > 0 && (
                                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-900/40 rounded-xl p-4 shadow-sm animate-fade-in">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                                                {t('errors.allFieldsRequired')}
                                            </p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {formErrors.map((error, idx) => (
                                                    <li key={idx} className="text-red-700 dark:text-red-300 text-sm">{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Student Info */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6 mb-6 border border-blue-200 dark:border-slate-700">
                                <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    {t('modal.studentInfo')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-slate-200">{t('modal.name')}:</span>
                                        <span className="text-gray-600 dark:text-slate-300">{selectedEntente.etudiantNomComplet || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-slate-200">{t('modal.email')}:</span>
                                        <span className="text-gray-600 dark:text-slate-300">{selectedEntente.etudiantEmail || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:col-span-2">
                                        <span className="font-semibold text-gray-700 dark:text-slate-200">{t('modal.internshipTitle')}:</span>
                                        <span className="text-gray-600 dark:text-slate-300">{selectedEntente.titre}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:col-span-2">
                                        <span className="font-semibold text-gray-700 dark:text-slate-200">{t('modal.period')}:</span>
                                        <span className="text-gray-600 dark:text-slate-300">{formatDate(selectedEntente.dateDebut)} → {formatDate(selectedEntente.dateFin)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step Content */}
                            <form onSubmit={handleSubmitEvaluation}>
                                {renderStepContent()}
                            </form>
                        </div>

                        {/* Footer fixe avec boutons de navigation */}
                        <div className="bg-white dark:bg-slate-800 border-t-2 border-gray-200 dark:border-slate-700 px-8 py-5 flex justify-between items-center flex-shrink-0 gap-4">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Précédent
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModals}
                                    className="cursor-pointer px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl transition-all"
                                >
                                    {t('modal.actions.cancel')}
                                </button>

                                {currentStep < steps.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Suivant
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        onClick={handleSubmitEvaluation}
                                        disabled={actionLoading}
                                        className="cursor-pointer flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails d'évaluation (VISUALISATION PDF) */}
            {showDetailsModal && selectedEvaluation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-2xl font-bold text-white">
                                {t('detailsModal.title')}
                            </h2>
                            <button
                                onClick={handleCloseModals}
                                className="cursor-pointer text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-5 mb-6 flex items-center gap-4 border border-green-200 dark:border-slate-700">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">{t('detailsModal.evaluationDate')}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{formatDate(selectedEvaluation.dateEvaluation)}</p>
                                </div>
                            </div>

                            {(() => {
                                const entente = ententes.find(e => e.id === selectedEvaluation.ententeId);
                                return entente ? (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6 mb-6 border border-blue-200 dark:border-slate-700">
                                        <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-600" />
                                            {t('detailsModal.studentInfo')}
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-700 dark:text-slate-200">{t('modal.name')}:</span>
                                                <span className="text-gray-600 dark:text-slate-300">{entente.etudiantNomComplet || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-700 dark:text-slate-200">{t('modal.email')}:</span>
                                                <span className="text-gray-600 dark:text-slate-300">{entente.etudiantEmail || 'N/A'}</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-slate-700">
                                                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-2">{t('detailsModal.internshipInfo')}</p>
                                                <p className="font-semibold text-gray-800 dark:text-slate-100 mb-1">{entente.titre}</p>
                                                <p className="text-gray-600 dark:text-slate-300">{formatDate(entente.dateDebut)} → {formatDate(entente.dateFin)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6 text-center border border-gray-200 dark:border-slate-700">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Eye className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-gray-700 dark:text-slate-300 mb-4 font-medium">{t('detailsModal.pdfInfo')}</p>
                                <button
                                    onClick={() => handleGetPDF(selectedEvaluation)}
                                    className="cursor-pointer inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Eye className="w-5 h-5" />
                                    {t('detailsModal.viewPDF')}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-slate-700 px-8 py-5 flex-shrink-0">
                            <button
                                onClick={handleCloseModals}
                                className="cursor-pointer w-full px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-xl transition-all"
                            >
                                {t('detailsModal.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal PDF */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold mb-1">
                                    {t('detailsModal.previewTitle')}
                                </h3>
                                {pdfFilename && (
                                    <p className="text-sm text-blue-100">{pdfFilename}</p>
                                )}
                            </div>
                            <button onClick={closePdfModal} className="cursor-pointer text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-900">
                            {pdfLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600" />
                                </div>
                            ) : pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-[70vh] border-0 rounded-xl shadow-lg"
                                    title="PDF Preview"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="text-center py-20">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-slate-300">{t('detailsModal.noPdfPreview')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t dark:border-slate-700 flex items-center justify-between gap-4 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {pdfUrl && pdfFilename && (
                                    <a
                                        href={pdfUrl}
                                        download={pdfFilename}
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                    >
                                        {t('detailsModal.downloadPdf')}
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={closePdfModal}
                                className="px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-semibold rounded-xl transition-all"
                            >
                                {t('detailsModal.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeurEvaluationStagiaire;
