import * as React from "react";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {
    AlertCircle,
    BookOpen,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    ClipboardList,
    Clock,
    FileText,
    FileX,
    GraduationCap,
    Loader2,
    Mail,
    Phone,
    Users,
    X
} from "lucide-react";
import NavBar from "../NavBar.tsx";
import {
    type CandidatureDTO,
    type CreerEvaluationMilieuStageDTO,
    type EntenteStageDTO,
    type EtudiantDTO,
    type EvaluationMilieuStageDTO,
    professeurService,
    type StatutStageDTO
} from "../../services/ProfesseurService.ts";

const DashboardProfesseur = () => {
    const { t } = useTranslation('dashboardProfesseur');
    const navigate = useNavigate();
    const token = sessionStorage.getItem("authToken") || "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [, setErrorModal] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [evaluations, setEvaluations] = useState<EvaluationMilieuStageDTO[]>([]);
    const [ententesDisponibles, setEntentesDisponibles] = useState<EntenteStageDTO[]>([]);
    const [loadingEntentesDisponibles, setLoadingEntentesDisponibles] = useState(false);
    const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
    const initialEvaluationForm: CreerEvaluationMilieuStageDTO = {
        ententeId: 0,
        nomEntreprise: '', personneContact: '', adresse: '', ville: '', codePostal: '', telephone: '', telecopieur: '',
        nomStagiaire: '', dateDuStage: '', stageNumero: '',
        tachesConformes: '', mesuresAccueil: '', tempsEncadrementSuffisant: '',
        environnementSecurite: '', climatTravail: '', milieuAccessible: '', salaireInteressant: '', communicationSuperviseur: '', equipementAdequat: '', volumeTravailAcceptable: '',
        heuresPremierMois: '', heuresDeuxiemeMois: '', heuresTroisiemeMois: '', salaireMontantHeure: '',
        commentaires: '', milieuAPrivilegier: '', accueillirStagiairesNb: '', desireAccueillirMemeStagiaire: '', offreQuartsVariables: '',
        quartsADe: '', quartsAFin: '', quartsBDe: '', quartsBFin: '', quartsCDe: '', quartsCFin: '', dateSignature: ''
    };
    const [evaluationForm, setEvaluationForm] = useState<CreerEvaluationMilieuStageDTO>({...initialEvaluationForm});
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationMilieuStageDTO | null>(null);
    const [selectedEtudiant, setSelectedEtudiant] = useState<EtudiantDTO | null>(null);
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>("");
    const [viewMode, setViewMode] = useState<'candidatures' | 'ententes' | 'evaluation' | null>(null);
    const [candidatures, setCandidatures] = useState<CandidatureDTO[]>([]);
    const [ententesStudent, setEntentesStudent] = useState<EntenteStageDTO[]>([]);
    const [loadingCandidatures, setLoadingCandidatures] = useState(false);
    const [loadingEntentes, setLoadingEntentes] = useState(false);
    const [statutsStage, setStatutsStage] = useState<Record<number, StatutStageDTO>>({});
    const [downloadingLettre, setDownloadingLettre] = useState<number | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(0);


    const stageNumeroOptions = [
        { value: 'STAGE_1', label: t('options.stageNumero.STAGE_1') },
        { value: 'STAGE_2', label: t('options.stageNumero.STAGE_2') },
    ];

    const ouiNonOptions = [
        { value: 'OUI', label: t('options.ouiNon.OUI') },
        { value: 'NON', label: t('options.ouiNon.NON') },
    ];

    const stagiairesNbOptions = [
        { value: 'UN_STAGIAIRE', label: t('options.stagiairesNb.UN_STAGIAIRE') },
        { value: 'DEUX_STAGIAIRES', label: t('options.stagiairesNb.DEUX_STAGIAIRES') },
        { value: 'TROIS_STAGIAIRES', label: t('options.stagiairesNb.TROIS_STAGIAIRES') },
        { value: 'PLUS_DE_TROIS', label: t('options.stagiairesNb.PLUS_DE_TROIS') },
    ];

    // Détermine si le champ 'commentaires' est requis (au moins une réponse négative)
    const commentaireRequired = (() => {
        const negativeValues = ['PLUTOT_DESACCORD', 'TOTALEMENT_DESACCORD'];
        const fieldsToCheck: (keyof CreerEvaluationMilieuStageDTO)[] = [
            'tachesConformes', 'mesuresAccueil', 'tempsEncadrementSuffisant', 'environnementSecurite', 'climatTravail', 'milieuAccessible', 'salaireInteressant', 'communicationSuperviseur', 'equipementAdequat', 'volumeTravailAcceptable'
        ];
        return fieldsToCheck.some(f => negativeValues.includes(((evaluationForm as any)[f] || '') as string));
    })();

    const renderRadioGroup = (field: keyof CreerEvaluationMilieuStageDTO, options: {value:string,label:string}[], label: string) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{label}</label>
            <div className="flex gap-2">
                {options.map(opt => {
                    const selected = (evaluationForm as any)[field] === opt.value;
                    return (
                        <button
                            type="button"
                            key={opt.value}
                            onClick={() => handleFormChange(field, opt.value)}
                            className={`cursor-pointer flex-1 text-center px-4 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'}`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const msg = (key: string, defaultValue?: string) => t(key, { defaultValue: defaultValue ?? key });

    interface LikertOption { value: string; label: string; colorClass: string; bgClass: string }
    const LikertRadio: React.FC<{ name: string; value: string | undefined; onChange: (v:string) => void; label: string; required?: boolean }> = ({ name, value, onChange, label, required }) => {
         const options: LikertOption[] = [
            { value: 'TOTALEMENT_EN_ACCORD', label: msg('likert.totallyAgree', 'Totalement en accord'), colorClass: 'border-green-500 ring-green-500 dark:border-green-400 dark:ring-green-400', bgClass: 'bg-green-50 dark:bg-slate-800/40' },
            { value: 'PLUTOT_EN_ACCORD', label: msg('likert.agree', 'Plutôt en accord'), colorClass: 'border-teal-500 ring-teal-500 dark:border-teal-400 dark:ring-teal-400', bgClass: 'bg-teal-50 dark:bg-slate-800/35' },
            { value: 'PLUTOT_DESACCORD', label: msg('likert.disagree', 'Plutôt en désaccord'), colorClass: 'border-yellow-500 ring-yellow-500 dark:border-yellow-400 dark:ring-yellow-400', bgClass: 'bg-yellow-50 dark:bg-slate-800/30' },
            { value: 'TOTALEMENT_DESACCORD', label: msg('likert.totallyDisagree', 'Totalement en désaccord'), colorClass: 'border-red-500 ring-red-500 dark:border-red-400 dark:ring-red-400', bgClass: 'bg-red-50 dark:bg-slate-800/30' },
            { value: 'IMPOSSIBLE_DE_SE_PRONONCER', label: msg('likert.notApplicable', 'Impossible de se prononcer'), colorClass: 'border-gray-500 ring-gray-500 dark:border-slate-600 dark:ring-slate-600', bgClass: 'bg-gray-50 dark:bg-slate-800' },
        ];

        return (
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100 mb-3 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{label}</span>
                    {required && <span className="text-red-500 ml-1">*</span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {options.map(opt => {
                        const selected = value === opt.value;
                        return (
                            <label key={opt.value} className={`relative flex items-center justify-center cursor-pointer border-2 rounded-lg p-3 transition-all ${selected ? `${opt.colorClass} ${opt.bgClass} ring-2 ring-offset-2 dark:ring-offset-slate-800` : 'border-gray-200 hover:border-gray-300 bg-white dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-800'}`}>
                                <input type="radio" name={name} value={opt.value} checked={selected} onChange={() => onChange(opt.value)} className="sr-only" />
                                <span className={`text-xs font-medium text-center ${selected ? 'text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-300'}`}>{opt.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Ouvre le formulaire d'évaluation pour un étudiant précis
    const openFormForStudent = async (etudiant: EtudiantDTO) => {
        if (!etudiant || !etudiant.id) return;
        setError("");
        setSelectedEtudiant(etudiant);
        setEvaluationForm(prev => ({ ...prev, ententeId: 0 }));
        setLoadingEntentesDisponibles(true);
        try {
            const data = await professeurService.getEntentesPourEtudiant(etudiant.id, token);
            // garder seulement les ententes signées et qui ne sont pas encore évaluées
            const signed = data.filter((entente: any) =>
                (entente.etudiantSignature === 'SIGNEE' && entente.employeurSignature === 'SIGNEE' && entente.statut === 'SIGNEE')
            );
            const available = signed.filter((entente: any) => !evaluations.some((ev: any) => ev.ententeId === entente.id))
                .map((entente: any) => ({ ...entente, etudiantNomComplet: `${etudiant.prenom} ${etudiant.nom}` }));
            setEntentesDisponibles(available);
            // Pré-sélection automatique : si au moins une entente est disponible, la choisir automatiquement
            if (available && available.length > 0) {
                setEvaluationForm(prev => ({ ...prev, ententeId: available[0].id }));
            } else {
                setEvaluationForm(prev => ({ ...prev, ententeId: 0 }));
            }
            setViewMode('evaluation');
        } catch (err: any) {
            console.error('Erreur chargement ententes pour étudiant', etudiant.id, err);
            setError(t('dashboardProfesseur:messages.ententeLoadError') || 'Erreur chargement ententes');
        } finally {
            setLoadingEntentesDisponibles(false);
        }
    };

    // Check authentication
    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "PROFESSEUR") {
            navigate("/login");
            return;
        }

        if (!token) {
            setError(t("messages.unauthorized"));
            return;
        }

        loadData();
    }, [navigate, token, t]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            // Load evaluations, students, and their internship agreements in parallel
            const [evaluationsData, etudiantsData] = await Promise.all([
                professeurService.getEvaluationsMilieuStage(),
                professeurService.getMesEtudiants(token)
            ]);

            setEvaluations(evaluationsData);
            setEtudiants(etudiantsData);

        } catch (e: any) {
            setError(e.message || t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field: keyof CreerEvaluationMilieuStageDTO, value: string | number) => {
        setEvaluationForm(prev => {
            // apply the normal change
            const next = { ...prev, [field]: value } as CreerEvaluationMilieuStageDTO;

            // If the employer indicates there are no variable shifts, clear all quart fields
            if (field === 'offreQuartsVariables') {
                if (String(value) === 'NON') {
                    next.quartsADe = '';
                    next.quartsAFin = '';
                    next.quartsBDe = '';
                    next.quartsBFin = '';
                    next.quartsCDe = '';
                    next.quartsCFin = '';
                }
            }

            return next;
        });
    };

    const validateForm = (): boolean => {
      const errors: string[] = [];

        if (!evaluationForm.ententeId || evaluationForm.ententeId === 0) {
            errors.push(t('errors.selectEntente'));
        }

        if (!evaluationForm.stageNumero || evaluationForm.stageNumero === '') {
            errors.push(t('errors.selectStageNumber'));
        }

        const evaluationFields: (keyof CreerEvaluationMilieuStageDTO)[] = [
            'tachesConformes', 'mesuresAccueil', 'tempsEncadrementSuffisant',
            'environnementSecurite', 'climatTravail', 'milieuAccessible',
            'salaireInteressant', 'communicationSuperviseur', 'equipementAdequat', 'volumeTravailAcceptable'
        ];

        const hasAnyEvaluation = evaluationFields.some(f => !!((evaluationForm as any)[f]));
        if (!hasAnyEvaluation) {
            errors.push(t('errors.answerEvaluationQuestions'));
        }

        if (commentaireRequired) {
            if (!evaluationForm.commentaires || (evaluationForm.commentaires || '').trim() === '') {
                errors.push(t('errors.commentRequired'));
            }
        }

        if (!evaluationForm.nomEntreprise || evaluationForm.nomEntreprise.trim() === '') {
            errors.push(t('errors.nomEntrepriseRequired'));
        }
        if (!evaluationForm.nomStagiaire || evaluationForm.nomStagiaire.trim() === '') {
            errors.push(t('errors.nomStagiaireRequired'));
        }

        if (!evaluationForm.dateDuStage || evaluationForm.dateDuStage.trim() === '') {
            errors.push(t('errors.dateDuStageRequired'));
        }

        if (!evaluationForm.personneContact || evaluationForm.personneContact.trim() === '') {
            errors.push(t('errors.personneContactRequired'));
        }

       if (!evaluationForm.heuresPremierMois || isNaN(Number(evaluationForm.heuresPremierMois))) {
            errors.push(t('errors.heuresPremierMoisRequired'));
        }
        if (!evaluationForm.heuresDeuxiemeMois || isNaN(Number(evaluationForm.heuresDeuxiemeMois))) {
            errors.push(t('errors.heuresDeuxiemeMoisRequired'));
        }
        if (!evaluationForm.heuresTroisiemeMois || isNaN(Number(evaluationForm.heuresTroisiemeMois))) {
            errors.push(t('errors.heuresTroisiemeMoisRequired'));
        }
        if (!evaluationForm.salaireMontantHeure || isNaN(Number(evaluationForm.salaireMontantHeure))) {
            errors.push(t('errors.salaireMontantHeureRequired'));
        }

        // Quarts de travail
        if (evaluationForm.offreQuartsVariables === 'OUI') {
            if (!evaluationForm.quartsADe || !evaluationForm.quartsAFin) errors.push(t('errors.quartsARequired'));
            if (!evaluationForm.quartsBDe || !evaluationForm.quartsBFin) errors.push(t('errors.quartsBRequired'));
            if (!evaluationForm.quartsCDe || !evaluationForm.quartsCFin) errors.push(t('errors.quartsCRequired'));
        }

        setFormErrors(errors);
        if (errors.length > 0) {
            setErrorModal(errors[0]);
            return false;
        }
        setErrorModal('');
        return true;
    };

    // Ajout d'une fonction de validation pour les groupes de boutons radio afin de définir une valeur par défaut si aucun choix n'est fait
    const validateRadioGroup = (value: string | undefined, defaultValue: string): string => {
        return value && value.trim() !== "" ? value : defaultValue;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorModal("");

        if (!validateForm()) {
            return;
        }

        try {
            setSubmittingEvaluation(true);

            // Validation des groupes de boutons radio avant l'envoi
            const validatedEvaluationForm = {
                ...evaluationForm,
                tachesConformes: validateRadioGroup(evaluationForm.tachesConformes, "TOTALEMENT_EN_ACCORD"),
                mesuresAccueil: validateRadioGroup(evaluationForm.mesuresAccueil, "TOTALEMENT_EN_ACCORD"),
                tempsEncadrementSuffisant: validateRadioGroup(evaluationForm.tempsEncadrementSuffisant, "TOTALEMENT_EN_ACCORD"),
                environnementSecurite: validateRadioGroup(evaluationForm.environnementSecurite, "TOTALEMENT_EN_ACCORD"),
                climatTravail: validateRadioGroup(evaluationForm.climatTravail, "TOTALEMENT_EN_ACCORD"),
                milieuAccessible: validateRadioGroup(evaluationForm.milieuAccessible, "TOTALEMENT_EN_ACCORD"),
                salaireInteressant: validateRadioGroup(evaluationForm.salaireInteressant, "TOTALEMENT_EN_ACCORD"),
                communicationSuperviseur: validateRadioGroup(evaluationForm.communicationSuperviseur, "TOTALEMENT_EN_ACCORD"),
                equipementAdequat: validateRadioGroup(evaluationForm.equipementAdequat, "TOTALEMENT_EN_ACCORD"),
                volumeTravailAcceptable: validateRadioGroup(evaluationForm.volumeTravailAcceptable, "TOTALEMENT_EN_ACCORD"),
            };

            await professeurService.creerEvaluationMilieuStage(validatedEvaluationForm);

            setEvaluationForm({...initialEvaluationForm});
            // fermer le modal d'évaluation et réinitialiser l'étudiant sélectionné
            setSelectedEtudiant(null);
            setViewMode(null);
            setEntentesDisponibles([]);
            await loadData();

            setError("");
            setErrorModal("");
            setSuccess(t("messages.success"));

        } catch (e: any) {
            if (e.message.includes("déjà été évaluée") || e.message.includes("already been evaluated")) {
                setErrorModal(t("messages.alreadyEvaluated"));
            } else if (e.message.includes("non autorisée") || e.message.includes("not authorized")) {
                setErrorModal(t("messages.unauthorized"));
            } else if (e.message.includes("signée") || e.message.includes("signed")) {
                setErrorModal(t("messages.ententeNotFinalized"));
            } else {
                setErrorModal(e.message || t("messages.error"));
            }
        } finally {
            setSubmittingEvaluation(false);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA');
    };

    const handleViewCV = async (etudiant: EtudiantDTO) => {
        if (!etudiant.id) return;

        try {
            setDownloadingCV(etudiant.id);
            const blob = await professeurService.getCV(etudiant.id, token);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(t('pdf.cvTitle', { name: `${etudiant.prenom} ${etudiant.nom}` }));
        } catch (error) {
            console.error("Erreur lors du chargement du CV:", error);
            setError(t('errors.cvDownload'));
        } finally {
            setDownloadingCV(null);
        }
    };

    // Télécharger / ouvrir le PDF d'une évaluation et l'afficher dans le viewer
    const handleViewEvaluationPdf = async (evaluationId: number) => {
        if (!evaluationId) return;
        try {
            const blob = await professeurService.getEvaluationMilieuStagePdf(evaluationId);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(t('pdf.evaluationTitle'));
        } catch (err) {
            console.error('Erreur téléchargement PDF évaluation', err);
            setError(t('errors.evaluationPdfDownload'));
        }
    };

    // Nouvelle utilitaire : retourne la dernière évaluation pour un étudiant (ou null)
    const getLatestEvaluationForStudent = (studentId?: number | null): EvaluationMilieuStageDTO | null => {
        if (!studentId) return null;
        const evs = evaluations.filter(ev => ev.etudiantId === studentId);
        if (!evs || evs.length === 0) return null;
        // retourner l'évaluation la plus récente selon dateEvaluation
        return evs.reduce((latest, cur) => {
            try {
                return new Date(cur.dateEvaluation) > new Date(latest.dateEvaluation) ? cur : latest;
            } catch (e) {
                return latest;
            }
        }, evs[0]);
    };

    const handleViewCandidatures = async (etudiantId: number) => {
        setViewMode('candidatures');
        setLoadingCandidatures(true);
        try {
            const data = await professeurService.getCandidaturesPourEtudiant(etudiantId, token);
            setCandidatures(data);
        } catch (error) {
            console.error('Erreur lors du chargement des candidatures:', error);
            setError(t('errors.candidaturesLoad'));
        } finally {
            setLoadingCandidatures(false);
        }
    };

    const handleViewEntentes = async (etudiantId: number) => {
        setViewMode('ententes');
        setLoadingEntentes(true);
        try {
            const data = await professeurService.getEntentesPourEtudiant(etudiantId, token);
            setEntentesStudent(data);

            const signedEntentes = data.filter((e: EntenteStageDTO) =>
                e.etudiantSignature === 'SIGNEE' && e.employeurSignature === 'SIGNEE' && e.statut === 'SIGNEE'
            );

            const statuts: Record<number, StatutStageDTO> = {};
            for (const entente of signedEntentes) {
                try {
                    statuts[entente.id] = await professeurService.getStatutStage(entente.id, token);
                } catch (err) {
                    console.error(`Erreur chargement statut entente ${entente.id}:`, err);
                }
            }
            setStatutsStage(statuts);
        } catch (error) {
            console.error('Erreur lors du chargement des ententes:', error);
            setError(t('errors.ententesLoad'));
        } finally {
            setLoadingEntentes(false);
        }
    };

    const handleViewLettre = async (candidatureId: number) => {
        try {
            setDownloadingLettre(candidatureId);
            const blob = await professeurService.getLettreMotivation(candidatureId, token);
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfTitle(t('pdf.letterTitle', { id: candidatureId }));
        } catch (error) {
            console.error("Erreur lors du chargement de la lettre:", error);
            setError(t('errors.letterDownload'));
        } finally {
            setDownloadingLettre(null);
        }
    };

   const resetModalState = () => {
        setViewMode(null);
        setCandidatures([]);
        setEntentesStudent([]);
        setEntentesDisponibles([]);
        setStatutsStage({});
        setSelectedEtudiant(null);
        setSelectedEvaluation(null);
        setFormErrors([]);
        setEvaluationForm({...initialEvaluationForm});
        setPdfUrl(null);
        setPdfTitle("");
        setDownloadingCV(null);
        setDownloadingLettre(null);
        setErrorModal("");
        setSubmittingEvaluation(false);
        // leave success/error messages as-is (optional)
    };

   const closeModal = () => {
        resetModalState();
    };

    const renderCVColumn = (etudiant: EtudiantDTO) => {
        if (!etudiant.cv || etudiant.cv.length === 0) {
            return (
                <div className="flex items-center gap-2 text-gray-400">
                    <FileX className="w-4 h-4" />
                    <span className="text-sm">{t("students.noCV")}</span>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleViewCV(etudiant)}
                disabled={downloadingCV === etudiant.id}
                className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FileText className="w-4 h-4" />
                <span className="text-sm">{t("actions.viewCV")}</span>
            </button>
        );
    };

    const getProgramName = (programCode: string | undefined) => {
        if (!programCode) return t('misc.na');
        return t(`programmes:${programCode}`, {defaultValue: programCode});
    };

    // entente présélectionnée pour affichage dans le modal
    const selectedEntente = ententesDisponibles.find(e => e.id === evaluationForm.ententeId) || null;

    useEffect(() => {
        if (selectedEntente) {
            setEvaluationForm(prev => ({
                ...prev,
                nomEntreprise: (selectedEntente.nomEntreprise ?? prev.nomEntreprise) || '',
                personneContact: (selectedEntente.employeurContact ?? prev.personneContact) || '',
                nomStagiaire: selectedEtudiant ? `${selectedEtudiant.prenom} ${selectedEtudiant.nom}` : (prev.nomStagiaire || '')
            }));
        }
    }, [selectedEntente, selectedEtudiant]);

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-300">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-lg font-medium">{t("status.loading")}</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-indigo-900 dark:text-blue-500 flex items-center gap-3">
                                    {t("title")}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {success && (
                        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
                            </div>
                            <button
                                onClick={() => setSuccess("")}
                                className="cursor-pointer text-green-400 dark:text-green-300 hover:text-green-600 dark:hover:text-green-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="cursor-pointer text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Students List with CV and Actions */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden mb-8 border border-gray-200 dark:border-slate-700">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                {t("header.myStudents")}
                            </h2>
                        </div>

                        {etudiants.length === 0 ? (
                            <div className="p-12 text-center">
                                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">{t("status.noStudents")}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max">
                                    <thead className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-white min-w-[200px]">{t("list.student")}</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-white min-w-[120px]">{t('list.cv')}</th>
                                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-white min-w-[180px]">{t("list.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {etudiants.map((etudiant) => (
                                            <tr key={etudiant.id} className="hover:shadow-sm hover:bg-blue-50/60 dark:hover:bg-slate-700/50 transition-all duration-200">
                                                <td className="px-4 py-4 min-w-[240px]">
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar / Icône principale */}
                                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                                                        </div>

                                                        {/* Informations de l'étudiant */}
                                                        <div className="flex flex-col min-w-0">
                                                            {/* Nom complet */}
                                                            <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm md:text-base truncate">
                                                                {etudiant.prenom} {etudiant.nom}
                                                            </div>

                                                            {/* Email */}
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300 truncate">
                                                                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                                                <span>{etudiant.email}</span>
                                                            </div>

                                                            {/* Téléphone */}
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300 truncate">
                                                                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                                                <span>{etudiant.telephone}</span>
                                                            </div>

                                                            {/* Programme */}
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium w-fit">
                                                                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                                                <span className="truncate">{getProgramName(etudiant.progEtude)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 min-w-[120px]">
                                                    {renderCVColumn(etudiant)}
                                                </td>
                                                <td className="px-4 py-4 min-w-[180px]">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => etudiant.id && handleViewCandidatures(etudiant.id)}
                                                            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors text-xs font-medium"
                                                            title={t('actions.candidatures')}
                                                        >
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span>{t("actions.candidatures")}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => etudiant.id && handleViewEntentes(etudiant.id)}
                                                            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors text-xs font-medium"
                                                            title={t('actions.ententes')}
                                                        >
                                                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                                                            <span>{t("actions.ententes")}</span>
                                                        </button>
                                                        {(() => {
                                                            const studentEval = getLatestEvaluationForStudent(etudiant.id);
                                                            if (studentEval) {
                                                                return (
                                                                    <button
                                                                        onClick={() => handleViewEvaluationPdf(studentEval.id)}
                                                                        className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-gray-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-xs font-medium"
                                                                        title={t('actions.viewEvaluation')}
                                                                    >
                                                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                                                        <span>{t('actions.viewEvaluation')}</span>
                                                                    </button>
                                                                );
                                                            }

                                                            return (
                                                                <button
                                                                    onClick={() => openFormForStudent(etudiant)}
                                                                    className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-xs font-medium"
                                                                    title={t('actions.evaluate')}
                                                                >
                                                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                                                    <span>{t("actions.evaluate")}</span>
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Evaluation Details Modal */}
            {selectedEvaluation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">{t("details.title")}</h3>
                            <button
                                onClick={() => resetModalState()}
                                className="cursor-pointer text-white/80 hover:text-white transition-colors"
                                aria-label={t('details.close')}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    {t("details.studentInfo")}
                                </h4>
                                <p className="text-gray-700 dark:text-slate-200">
                                    {selectedEvaluation.prenomEtudiant} {selectedEvaluation.nomEtudiant}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    {t("details.companyInfo")}
                                </h4>
                                <p className="text-gray-700 dark:text-slate-200">{selectedEvaluation.nomEntreprise}</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5" />
                                    {t("details.evaluationInfo")}
                                </h4>

                                <div className="space-y-4">
                                    <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4">
                                        <p className="font-medium text-gray-700 dark:text-slate-200 mb-1">{t("form.qualiteEncadrement")}</p>
                                        <p className="text-gray-600 dark:text-slate-300">{selectedEvaluation.qualiteEncadrement}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4">
                                        <p className="font-medium text-gray-700 dark:text-slate-200 mb-1">{t("form.pertinenceMissions")}</p>
                                        <p className="text-gray-600 dark:text-slate-300">{selectedEvaluation.pertinenceMissions}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4">
                                        <p className="font-medium text-gray-700 dark:text-slate-200 mb-1">{t("form.respectHoraires")}</p>
                                        <p className="text-gray-600 dark:text-slate-300">{selectedEvaluation.respectHorairesConditions}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4">
                                        <p className="font-medium text-gray-700 dark:text-slate-200 mb-1">{t("form.communication")}</p>
                                        <p className="text-gray-600 dark:text-slate-300">{selectedEvaluation.communicationDisponibilite}</p>
                                    </div>

                                    <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4">
                                        <p className="font-medium text-gray-700 dark:text-slate-200 mb-1">{t("form.commentaires")}</p>
                                        <p className="text-gray-600 dark:text-slate-300">{selectedEvaluation.commentairesAmelioration}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t("details.evaluationDate")}: {formatDate(selectedEvaluation.dateEvaluation)}
                                    </span>
                                    <span className="dark:text-slate-300">
                                        {t("details.evaluatedBy")}: {selectedEvaluation.prenomProfesseur} {selectedEvaluation.nomProfesseur}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => resetModalState()}
                                    className="px-6 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    {t("details.close")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Candidatures Modal */}
            {viewMode === 'candidatures' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-purple-600" />
                                {t("candidatures.title")}
                            </h3>
                            <button onClick={closeModal} className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors" aria-label={t('details.close')}>
                                <X className="w-6 h-6 text-gray-900 dark:text-slate-100" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingCandidatures ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />
                                </div>
                            ) : candidatures.length === 0 ? (
                                <p className="text-center text-gray-600 dark:text-slate-300 py-12">{t("candidatures.noData")}</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidatures.map((candidature) => (
                                        <div key={candidature.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{candidature.offreTitre}</h4>
                                                    <p className="text-sm text-gray-600 dark:text-slate-300">{t("ententes.employer")} : {candidature.employeurNom}</p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                                        {t('candidatures.dateLabel')}: {new Date(candidature.dateCandidature).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    {candidature.alettreMotivation ? (
                                                        <button
                                                            onClick={() => handleViewLettre(candidature.id)}
                                                            disabled={downloadingLettre === candidature.id}
                                                            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span>{t("actions.viewLetter")}</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-400">
                                                            <FileX className="w-4 h-4" />
                                                            <span className="text-sm">{t("actions.noLetter")}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Ententes Modal */}
            {viewMode === 'ententes' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-green-600" />
                                {t("actions.ententes")}
                            </h3>
                            <button onClick={closeModal} className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors" aria-label={t('details.close')}>
                                <X className="w-6 h-6 text-gray-900 dark:text-slate-100" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingEntentes ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />
                                </div>
                            ) : ententesStudent.length === 0 ? (
                                <p className="text-center text-gray-600 dark:text-slate-300 py-12">{t("messages.noEntentes")}</p>
                            ) : (
                                <div className="space-y-4">
                                    {ententesStudent.map((entente) => {
                                        const isSigned = entente.etudiantSignature === 'SIGNEE' && entente.employeurSignature === 'SIGNEE';
                                        const statut = isSigned ? statutsStage[entente.id] : null;

                                        return (
                                            <div key={entente.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{entente.titre}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{entente.description}</p>
                                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t("ententes.employer")}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{entente.employeurContact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t("ententes.location")}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{entente.lieu}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t("ententes.period")}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                                                    {new Date(entente.dateDebut).toLocaleDateString()} - {new Date(entente.dateFin).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500 dark:text-slate-400">{t("ententes.weeklyHours")}</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{entente.dureeHebdomadaire}h</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            {entente.etudiantSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <div className="text-sm text-gray-600 dark:text-slate-300">
                                                                <div className="font-medium">{t('ententes.studentSignature')}</div>
                                                                <div className="text-sm text-gray-500 dark:text-slate-400">{t(`ententes.signature.${entente.etudiantSignature}`) || entente.etudiantSignature}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {entente.employeurSignature === 'SIGNEE' ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            ) : (
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                            )}
                                                            <div className="text-sm text-gray-600 dark:text-slate-300">
                                                                <div className="font-medium">{t('ententes.employerSignature')}</div>
                                                                <div className="text-sm text-gray-500 dark:text-slate-400">{t(`ententes.signature.${entente.employeurSignature}`) || entente.employeurSignature}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isSigned && (
                                                        <div className="px-4 py-2 bg-blue-50 dark:bg-slate-700 rounded-lg">
                                                            <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("ententes.statusLabel")}</div>
                                                            <div className="mt-1 text-sm text-gray-700 dark:text-slate-200">
                                                                {statut ? t(`ententes.status.${statut}`, { defaultValue: statut }) : t('ententes.unknown')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {viewMode === 'evaluation' && selectedEtudiant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6" />
                                    {t("form.header")}
                                </h3>
                                <p className="text-indigo-100 mt-1 text-sm">{t("form.headerStudent")} {selectedEtudiant.prenom} {selectedEtudiant.nom}</p>
                            </div>
                            <button
                                onClick={() => { resetModalState(); setCurrentStep(0); }}
                                className="cursor-pointer p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label={t('details.close')}
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Errors */}
                            {formErrors && formErrors.length > 0 && (
                                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-red-800 dark:text-red-200 font-semibold">{t('errors.formErrorsTitle') || 'Veuillez corriger les erreurs suivantes :'}</p>
                                            <ul className="mt-2 list-disc pl-5 text-sm text-red-700 dark:text-red-200">
                                                {formErrors.map((err, idx) => (
                                                    <li key={idx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loadingEntentesDisponibles ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                                </div>
                            ) : ententesDisponibles.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-slate-300 text-lg">{t("messages.noEntentes")}</p>
                                    <p className="text-gray-500 dark:text-slate-400 mt-2">{t("messages.ententeNotFinalized")}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">

                                    {/* Stepper (Company / Student / Evaluation / Observations) */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            {[
                                                { key: 0, label: t('form.step.company') || 'Identification entreprise', icon: <Building2 className="w-5 h-5" /> },
                                                { key: 1, label: t('form.step.student') || 'Identification stagiaire', icon: <GraduationCap className="w-5 h-5" /> },
                                                { key: 2, label: t('form.step.evaluation') || 'Évaluation', icon: <ClipboardList className="w-5 h-5" /> },
                                                { key: 3, label: t('form.step.observations') || 'Observations', icon: <Briefcase className="w-5 h-5" /> }
                                            ].map(s => (
                                                <div key={s.key} className={`flex-1 text-center text-xs font-medium ${currentStep === s.key ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                    <div className={`mx-auto mb-1 w-9 h-9 rounded-full flex items-center justify-center ${currentStep === s.key ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{s.icon}</div>
                                                    <div className="truncate">{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-1 bg-gray-200 rounded overflow-hidden">
                                            <div className="h-1 bg-indigo-600 transition-all" style={{ width: `${((currentStep + 1) / 4) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* 1) Identification de l'entreprise */}
                                    {currentStep === 0 && (
                                        <section className="rounded-2xl p-6 border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                                    {t("form.company.title")}
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.name")}</label>
                                                    <input value={evaluationForm.nomEntreprise || ''} onChange={(e) => handleFormChange('nomEntreprise', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.contact")}</label>
                                                    <input value={evaluationForm.personneContact || ''} onChange={(e) => handleFormChange('personneContact', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.address")}</label>
                                                    <input value={evaluationForm.adresse || ''} onChange={(e) => handleFormChange('adresse', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.city")}</label>
                                                    <input value={evaluationForm.ville || ''} onChange={(e) => handleFormChange('ville', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.postal")}</label>
                                                    <input value={evaluationForm.codePostal || ''} onChange={(e) => handleFormChange('codePostal', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.phone")}</label>
                                                    <input value={evaluationForm.telephone || ''} onChange={(e) => handleFormChange('telephone', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.company.fax")}</label>
                                                    <input value={evaluationForm.telecopieur || ''} onChange={(e) => handleFormChange('telecopieur', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* 2) Identification du stagiaire */}
                                    {currentStep === 1 && (
                                        <section className="rounded-2xl p-6 border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600" /> {t("form.section.student")}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.student.name")}</label>
                                                    <input value={evaluationForm.nomStagiaire || ''} onChange={(e) => handleFormChange('nomStagiaire', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.student.date")}</label>
                                                    <input type="date" value={evaluationForm.dateDuStage || ''} onChange={(e) => handleFormChange('dateDuStage', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                </div>
                                                <div>
                                                    {renderRadioGroup('stageNumero', stageNumeroOptions, t("form.student.stageNumberLabel"))}
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* 3) Évaluation (choix + commentaire) */}
                                    {currentStep === 2 && (
                                        <section className="rounded-2xl p-6 border-2 border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-600" /> {t('form.section.evaluation') || t('form.section.evaluation')}</h4>
                                            <div className="space-y-4">
                                                <LikertRadio name="tachesConformes" value={(evaluationForm.tachesConformes || undefined)} onChange={(v) => handleFormChange('tachesConformes', v)} label={t("form.questions.tachesConformes")} required />
                                                <LikertRadio name="mesuresAccueil" value={(evaluationForm.mesuresAccueil || undefined)} onChange={(v) => handleFormChange('mesuresAccueil', v)} label={t("form.questions.mesuresAccueil")} required />
                                                <LikertRadio name="tempsEncadrementSuffisant" value={(evaluationForm.tempsEncadrementSuffisant || undefined)} onChange={(v) => handleFormChange('tempsEncadrementSuffisant', v)} label={t("form.questions.tempsEncadrementSuffisant")} required />
                                                <LikertRadio name="environnementSecurite" value={(evaluationForm.environnementSecurite || undefined)} onChange={(v) => handleFormChange('environnementSecurite', v)} label={t("form.questions.environnementSecurite")} required />
                                                <LikertRadio name="climatTravail" value={(evaluationForm.climatTravail || undefined)} onChange={(v) => handleFormChange('climatTravail', v)} label={t("form.questions.climatTravail")} required />
                                                <LikertRadio name="milieuAccessible" value={(evaluationForm.milieuAccessible || undefined)} onChange={(v) => handleFormChange('milieuAccessible', v)} label={t("form.questions.milieuAccessible")} required />
                                                <LikertRadio name="salaireInteressant" value={(evaluationForm.salaireInteressant || undefined)} onChange={(v) => handleFormChange('salaireInteressant', v)} label={t("form.questions.salaireInteressant")} required />
                                                <LikertRadio name="communicationSuperviseur" value={(evaluationForm.communicationSuperviseur || undefined)} onChange={(v) => handleFormChange('communicationSuperviseur', v)} label={t("form.questions.communicationSuperviseur")} required />
                                                <LikertRadio name="equipementAdequat" value={(evaluationForm.equipementAdequat || undefined)} onChange={(v) => handleFormChange('equipementAdequat', v)} label={t("form.questions.equipementAdequat")} required />
                                                <LikertRadio name="volumeTravailAcceptable" value={(evaluationForm.volumeTravailAcceptable || undefined)} onChange={(v) => handleFormChange('volumeTravailAcceptable', v)} label={t("form.questions.volumeTravailAcceptable")} required />

                                                {/* Commentaires intégrés dans la section Évaluation */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{t('form.comments.label')}</label>
                                                    <textarea
                                                        value={evaluationForm.commentaires || ''}
                                                        onChange={(e) => handleFormChange('commentaires', e.target.value)}
                                                        rows={5}
                                                        className={`w-full px-3 py-2 border rounded-lg resize-y bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600 focus:outline-none ${commentaireRequired && (!evaluationForm.commentaires || evaluationForm.commentaires.trim() === '') ? 'ring-2 ring-red-400' : ''}`}
                                                        placeholder={t('form.comments.label')}
                                                    />
                                                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                        {commentaireRequired ? (
                                                            <span className="text-red-600">* {t('form.comments.requiredMsg')}</span>
                                                        ) : (
                                                            <span>{t('form.comments.helper') || ''}</span>
                                                        )}
                                                    </p>
                                                    {formErrors && formErrors.includes(t('errors.commentRequired')) && (
                                                        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{t('errors.commentRequired')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* 4) Observations générales (heures, salaire, quarts, autres observations) */}
                                    {currentStep === 3 && (
                                        <section className="rounded-2xl p-6 border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">Observations générales</h4>

                                            {/* Heures & Salaire */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.hours.firstMonth")}</label>
                                                    <input
                                                        type="number"
                                                        value={evaluationForm.heuresPremierMois || ''}
                                                        onChange={(e) => handleFormChange('heuresPremierMois', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                                                        placeholder={t("form.hours.placeholder")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.hours.secondMonth")}</label>
                                                    <input
                                                        type="number"
                                                        value={evaluationForm.heuresDeuxiemeMois || ''}
                                                        onChange={(e) => handleFormChange('heuresDeuxiemeMois', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                                                        placeholder={t("form.hours.placeholder")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.hours.thirdMonth")}</label>
                                                    <input
                                                        type="number"
                                                        value={evaluationForm.heuresTroisiemeMois || ''}
                                                        onChange={(e) => handleFormChange('heuresTroisiemeMois', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                                                        placeholder={t("form.hours.placeholder")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t("form.salary.amountPerHour")}</label>
                                                    <input
                                                        type="number"
                                                        value={evaluationForm.salaireMontantHeure || ''}
                                                        onChange={(e) => handleFormChange('salaireMontantHeure', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                                                        placeholder={t("form.salary.placeholder")}
                                                    />
                                                </div>
                                            </div>

                                            {/* Observations (radios, quarts, signature date) */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    {renderRadioGroup('milieuAPrivilegier', stageNumeroOptions, t("form.observations.milieuAPrivilegier"))}
                                                </div>
                                                <div>
                                                    {renderRadioGroup('accueillirStagiairesNb', stagiairesNbOptions, t("form.observations.accueillirStagiairesNb"))}
                                                </div>
                                                <div>
                                                    {renderRadioGroup('desireAccueillirMemeStagiaire', ouiNonOptions, t("form.observations.desireAccueillirMemeStagiaire"))}
                                                </div>
                                            </div>

                                            <div className="mb-4">{renderRadioGroup('offreQuartsVariables', ouiNonOptions, t('form.observations.offreQuartsVariables'))}</div>

                                            {evaluationForm.offreQuartsVariables === 'OUI' && (
                                                <div className="space-y-4 mb-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                                        <div className="md:col-span-1"><label className="block text-sm font-semibold text-gray-800 dark:text-slate-100">{t('form.observations.quart.A')}</label></div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-slate-300">{t('form.observations.quart.from')}</label>
                                                            <input type="time" value={evaluationForm.quartsADe || ''} onChange={(e) => handleFormChange('quartsADe', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-slate-300">{t('form.observations.quart.to')}</label>
                                                            <input type="time" value={evaluationForm.quartsAFin || ''} onChange={(e) => handleFormChange('quartsAFin', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                                        <div className="md:col-span-1"><label className="block text-sm font-semibold text-gray-800 dark:text-slate-100">{t('form.observations.quart.B')}</label></div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-slate-300">{t('form.observations.quart.from')}</label>
                                                            <input type="time" value={evaluationForm.quartsBDe || ''} onChange={(e) => handleFormChange('quartsBDe', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-slate-300">{t('form.observations.quart.to')}</label>
                                                            <input type="time" value={evaluationForm.quartsBFin || ''} onChange={(e) => handleFormChange('quartsBFin', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                                        <div className="md:col-span-1"><label className="block text-sm font-semibold text-gray-800 dark:text-slate-100">{t('form.observations.quart.C')}</label></div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-slate-300">{t('form.observations.quart.from')}</label>
                                                            <input type="time" value={evaluationForm.quartsCDe || ''} onChange={(e) => handleFormChange('quartsCDe', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-slate-300">{t('form.observations.quart.to')}</label>
                                                            <input type="time" value={evaluationForm.quartsCFin || ''} onChange={(e) => handleFormChange('quartsCFin', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">{t('form.observations.dateSignature')}</label>
                                                    <input type="date" value={evaluationForm.dateSignature || ''} onChange={(e) => handleFormChange('dateSignature', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* Navigation buttons */}
                                    <div className="flex items-center justify-between pt-2">
                                        <button type="button" disabled={currentStep === 0} onClick={() => setCurrentStep(s => Math.max(0, s - 1))} className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100">{t('form.back') || 'Back'}</button>
                                        {currentStep < 3 ? (
                                            <button type="button" onClick={() => setCurrentStep(s => Math.min(3, s + 1))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">{t('form.next') || 'Next'}</button>
                                        ) : (
                                            <div className="flex gap-4">
                                                <button type="submit" disabled={submittingEvaluation} className="cursor-pointer  bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg">
                                                    {submittingEvaluation ? (
                                                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> {t('form.submitting')}</span>
                                                    ) : (
                                                        t('form.submit')
                                                    )}
                                                </button>
                                                <button type="button" onClick={() => { resetModalState(); setCurrentStep(0); }} className="px-6 py-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100">{t('form.cancel')}</button>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* PDF Viewer Modal (pour CV / lettre) */}
            {pdfUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{pdfTitle}</h2>
                            <button
                                onClick={() => {
                                    window.URL.revokeObjectURL(pdfUrl);
                                    setPdfUrl(null);
                                }}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg"
                                aria-label={t('details.close')}
                            >
                                <X className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                            </button>
                        </div>
                        <iframe
                            src={pdfUrl}
                            title={pdfTitle}
                            className="flex-1 w-full bg-white dark:bg-slate-800"
                            style={{ border: "none" }}
                        />
                    </div>
                </div>
            )}

        </>
    );
};

export default DashboardProfesseur;

