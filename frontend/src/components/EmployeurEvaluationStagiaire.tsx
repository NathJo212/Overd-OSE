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
    Clock,
    MessageSquare,
    AlertCircle,
    Briefcase
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar";
import employeurService from '../services/EmployeurService';
import type { EntenteStageDTO, EvaluationDTO } from '../services/EmployeurService';

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

    const [formData, setFormData] = useState({
        competencesTechniques: '',
        respectDelais: '',
        attitudeIntegration: '',
        commentaires: ''
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formErrors, setFormErrors] = useState<string[]>([]);

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
                e => e.etudiantSignature === 'SIGNEE' && e.employeurSignature === 'SIGNEE'
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
        setFormData({
            competencesTechniques: '',
            respectDelais: '',
            attitudeIntegration: '',
            commentaires: ''
        });
        setFormErrors([]);
        setSuccessMessage('');
        setShowEvaluationModal(true);
    };

    const handleOpenDetailsModal = (evaluation: EvaluationDTO) => {
        setSelectedEvaluation(evaluation);
        setShowDetailsModal(true);
    };

    const handleCloseModals = () => {
        setShowEvaluationModal(false);
        setShowDetailsModal(false);
        setSelectedEntente(null);
        setSelectedEvaluation(null);
        setFormData({
            competencesTechniques: '',
            respectDelais: '',
            attitudeIntegration: '',
            commentaires: ''
        });
        setFormErrors([]);
    };

    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (!formData.competencesTechniques.trim()) {
            errors.push(t('modal.sections.technicalSkills'));
        }
        if (!formData.respectDelais.trim()) {
            errors.push(t('modal.sections.timeManagement'));
        }
        if (!formData.attitudeIntegration.trim()) {
            errors.push(t('modal.sections.attitude'));
        }
        if (!formData.commentaires.trim()) {
            errors.push(t('modal.sections.generalComments'));
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

            const evaluationData: EvaluationDTO = {
                ententeId: selectedEntente.id,
                etudiantId: selectedEntente.etudiantId || 0,
                competencesTechniques: formData.competencesTechniques,
                respectDelais: formData.respectDelais,
                attitudeIntegration: formData.attitudeIntegration,
                commentaires: formData.commentaires
            };

            await employeurService.creerEvaluation(evaluationData);

            setSuccessMessage(t('messages.success'));

            // Recharger les données
            await loadEvaluations();

            setTimeout(() => {
                handleCloseModals();
                setSuccessMessage('');
            }, 2000);

        } catch (err: any) {
            console.error('Erreur lors de la soumission:', err);

            if (err.response?.data?.erreur) {
                setFormErrors([err.response.data.erreur.message || t('errors.submitFailed')]);
            } else if (err.code === 'ERR_NETWORK') {
                setFormErrors([t('errors.networkError')]);
            } else {
                setFormErrors([t('errors.submitFailed')]);
            }
        } finally {
            setActionLoading(false);
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
                                                {/* Stagiaire Info */}
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

                                                {/* Internship Info */}
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

                                                {/* Button */}
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

            {/* Modal d'évaluation */}
            {showEvaluationModal && selectedEntente && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
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

                        <div className="px-8 py-6">
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
                            <form onSubmit={handleSubmitEvaluation} className="space-y-6">
                                {/* Compétences techniques */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.technicalSkills')} <span className="text-red-500">{t('modal.fields.required')}</span>
                                    </label>
                                    <textarea
                                        value={formData.competencesTechniques}
                                        onChange={(e) => setFormData({...formData, competencesTechniques: e.target.value})}
                                        placeholder={t('modal.fields.technicalSkillsPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Respect des délais */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.timeManagement')} <span className="text-red-500">{t('modal.fields.required')}</span>
                                    </label>
                                    <textarea
                                        value={formData.respectDelais}
                                        onChange={(e) => setFormData({...formData, respectDelais: e.target.value})}
                                        placeholder={t('modal.fields.timeManagementPlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Attitude et intégration */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.attitude')} <span className="text-red-500">{t('modal.fields.required')}</span>
                                    </label>
                                    <textarea
                                        value={formData.attitudeIntegration}
                                        onChange={(e) => setFormData({...formData, attitudeIntegration: e.target.value})}
                                        placeholder={t('modal.fields.attitudePlaceholder')}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Commentaires généraux */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.generalComments')} <span className="text-red-500">{t('modal.fields.required')}</span>
                                    </label>
                                    <textarea
                                        value={formData.commentaires}
                                        onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
                                        placeholder={t('modal.fields.generalCommentsPlaceholder')}
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
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

            {/* Modal de détails d'évaluation */}
            {showDetailsModal && selectedEvaluation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {t('detailsModal.title')}
                            </h2>
                            <button
                                onClick={handleCloseModals}
                                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="px-8 py-6">
                            {/* Evaluation Date */}
                            <div className="bg-green-50 rounded-lg p-4 mb-6 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">{t('detailsModal.evaluationDate')}</p>
                                    <p className="font-semibold text-gray-900">{formatDate(selectedEvaluation.dateEvaluation)}</p>
                                </div>
                            </div>

                            {/* Stagiaire Info */}
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

                            {/* Evaluation Details */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.technicalSkills')}
                                    </h4>
                                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                                        {selectedEvaluation.competencesTechniques}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.timeManagement')}
                                    </h4>
                                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                                        {selectedEvaluation.respectDelais}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.attitude')}
                                    </h4>
                                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                                        {selectedEvaluation.attitudeIntegration}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        {t('modal.sections.generalComments')}
                                    </h4>
                                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                                        {selectedEvaluation.commentaires}
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="mt-8">
                                <button
                                    onClick={handleCloseModals}
                                    className="cursor-pointer w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
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