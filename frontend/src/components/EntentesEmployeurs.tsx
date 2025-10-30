import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileSignature,
    User,
    Calendar,
    Clock,
    DollarSign,
    AlertCircle,
    Briefcase,
    ArrowLeft,
    FileText,
    CheckCircle,
    RefreshCw,
    X,
    XCircle,
    Check,
    DollarSign
} from "lucide-react";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";
import { employeurService } from "../services/EmployeurService";
import type { EntenteStageDTO } from "../services/EmployeurService";


const EntentesEmployeurs = () => {
    const { t } = useTranslation(["ententesemployeurs"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ententes, setEntentes] = useState<EntenteStageDTO[]>([]);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedEntente, setSelectedEntente] = useState<EntenteStageDTO | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [showSignConfirm, setShowSignConfirm] = useState(false);
     const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }
        loadEntentes();
    }, [navigate]);

    const loadEntentes = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await employeurService.getEntentes();
            setEntentes(data);
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleEntenteClick = (entente: EntenteStageDTO) => {
        setSelectedEntente(entente);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedEntente(null);
    };



    const handleSignerClick = async () => {
        if (!selectedEntente) return;

        setActionLoading(true);
        try {
            await employeurService.signerEntente(selectedEntente.id);
            setSuccessMessage(t("ententesemployeurs:messages.signed"));
            closeModal();
            loadEntentes();
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.signError"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRefuserClick = () => {
        setShowModal(false);
        setShowRefuseModal(true);
    };

    const handleConfirmRefuse = async () => {
        if (!selectedEntente) return;

        setActionLoading(true);
        try {
            await employeurService.refuserEntente(selectedEntente.id);
            setSuccessMessage(t("ententesemployeurs:messages.refused"));
            setShowRefuseModal(false);
            setSelectedEntente(null);
            loadEntentes();
        } catch (err: any) {
            setError(err.message || t("ententesemployeurs:errors.refuseError"));
        } finally {
            setActionLoading(false);
        }
    };

    const getSignatureStatusBadge = (statut: string) => {
        switch (statut) {
            case 'SIGNEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.signed")}
                    </span>
                );
            case 'EN_ATTENTE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.pending")}
                    </span>
                );
            case 'REFUSEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <X className="w-3 h-3 mr-1" />
                        {t("ententesemployeurs:signature.refused")}
                    </span>
                );
            default:
                return null;
        }
    };

    const resolveField = (obj: any, ...keys: string[]) => {
        if (!obj) return undefined;
        for (const k of keys) {
            const v = obj[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') return v;
        }
        // try nested 'offre' object
        if (obj.offre) {
            for (const k of keys) {
                const v = obj.offre[k];
                if (v !== undefined && v !== null && String(v).trim() !== '') return v;
            }
        }
        return undefined;
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard-employeur')}
                        className="cursor-pointer mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t("ententesemployeurs:backToDashboard")}
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {t("ententesemployeurs:title")}
                            </h1>
                            <p className="text-gray-600">
                                {t("ententesemployeurs:subtitle")}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadEntentes}
                        className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t("ententesemployeurs:refresh")}
                    </button>
                </div>

                {/* Messages de succès */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-900">{successMessage}</p>
                            <button onClick={() => setSuccessMessage("")} className="cursor-pointer ml-auto text-green-600 hover:text-green-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

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

                {/* État de chargement */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                        </div>
                    </div>
                ) : ententes.length === 0 ? (
                    /* Message: Aucune entente */
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <FileSignature className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {t("ententesemployeurs:noEntentes.title")}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {t("ententesemployeurs:noEntentes.subtitle")}
                        </p>
                    </div>
                ) : (
                    /* Liste des ententes */
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{ententes.length}</span> {t("ententesemployeurs:ententeCount")}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                            {ententes.map((entente) => (
                                <div
                                    key={entente.id}
                                    onClick={() => handleEntenteClick(entente)}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-6 border border-slate-200 cursor-pointer group"
                                >
                                    {/* Badge et date */}
                                    <div className="flex items-center justify-between mb-4">
                                        {getSignatureStatusBadge(entente.employeurSignature)}
                                        <span className="text-xs text-gray-500">
                                            {entente.dateCreation ? new Date(entente.dateCreation).toLocaleDateString('fr-CA') : '-'}
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
                                                    {entente.etudiantNomComplet}
                                                </h3>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {entente.etudiantEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Titre de l'offre */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900 text-sm truncate">
                                                {entente.titre}
                                            </span>
                                        </div>

                                        {entente.description && (
                                            <p className="text-gray-600 text-sm truncate">{entente.description}</p>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-1 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span>{formatDate(entente.dateDebut)} → {formatDate(entente.dateFin)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        {resolveField(entente, 'horaire', 'schedule') && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{resolveField(entente, 'horaire', 'schedule')}</span>
                                            </div>
                                        )}
                                        {resolveField(entente, 'remuneration', 'salaire', 'salaireHoraire') && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{resolveField(entente, 'remuneration', 'salaire', 'salaireHoraire')} $</span>
                                            </div>
                                        )}
                                        {resolveField(entente, 'progEtude', 'prog', 'progEtudes', 'programme') && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{resolveField(entente, 'progEtude', 'prog', 'progEtudes', 'programme')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Indicateur hover */}
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            {t("ententesemployeurs:viewPdf")}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-3">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const blob = await employeurService.telechargerPdfEntente(entente.id);
                                                    const url = URL.createObjectURL(blob);
                                                    window.open(url, '_blank');
                                                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                                                } catch (err: any) {
                                                    setError(err?.message || t('ententesemployeurs:errors.pdfError'));
                                                }
                                            }}
                                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <FileText className="w-4 h-4" />
                                            {t('ententesemployeurs:viewPdf')}
                                        </button>

                                        {entente.employeurSignature === 'EN_ATTENTE' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedEntente(entente); setShowSignConfirm(true); }}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Signer
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedEntente(entente); setShowRefuseModal(true); }}
                                                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                    {t('ententesemployeurs:actions.refuse')}
                                                </button>
                                            </>
                                        )}

                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
             </div>

             {/* Modal détails de l'entente */}
             {showModal && selectedEntente && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                     <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                         {/* En-tête du modal */}
                         <div className="sticky top-0 bg-blue-50 px-6 py-4 border-b border-blue-100 rounded-t-2xl">
                             <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                         <FileSignature className="w-5 h-5 text-blue-600" />
                                     </div>
                                     <div>
                                         <h3 className="text-xl font-bold text-blue-900">
                                             {selectedEntente.titre || t('fields.defaultTitle')}
                                         </h3>
                                         <p className="text-sm text-blue-700">{selectedEntente.titre}</p>
                                     </div>
                                 </div>
                                 <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                     <X className="w-6 h-6" />
                                 </button>
                             </div>
                         </div>

                         {/* Contenu du modal */}
                         <div className="p-6 space-y-6">
                             {/* Signature statuses */}
                             <div className="bg-gray-50 rounded-xl p-4">
                                 <h4 className="font-semibold text-gray-900 mb-3">{t('ententesemployeurs:modal.signatures')}</h4>
                                 <div className="space-y-2">
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-700">{t('ententesemployeurs:modal.studentSignature')}</span>
                                         {selectedEntente.etudiantSignature === 'SIGNEE' ? (
                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                 <CheckCircle className="w-3 h-3 mr-1" />
                                                 {t('ententesemployeurs:signature.signed')}
                                             </span>
                                         ) : selectedEntente.etudiantSignature === 'EN_ATTENTE' ? (
                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                 <Clock className="w-3 h-3 mr-1" />
                                                 {t('ententesemployeurs:signature.pending')}
                                             </span>
                                         ) : (
                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                 <X className="w-3 h-3 mr-1" />
                                                 {t('ententesemployeurs:signature.refused')}
                                             </span>
                                         )}
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-700">{t('ententesemployeurs:modal.employerSignature')}</span>
                                         {selectedEntente.employeurSignature === 'SIGNEE' ? (
                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                 <CheckCircle className="w-3 h-3 mr-1" />
                                                 {t('ententesemployeurs:signature.signed')}
                                             </span>
                                         ) : selectedEntente.employeurSignature === 'EN_ATTENTE' ? (
                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                 <Clock className="w-3 h-3 mr-1" />
                                                 {t('ententesemployeurs:signature.pending')}
                                             </span>
                                         ) : (
                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                 <X className="w-3 h-3 mr-1" />
                                                 {t('ententesemployeurs:signature.refused')}
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             {/* Full offer/entente details */}
                             <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                 <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                     <Briefcase className="w-5 h-5 text-blue-600" />
                                     {t('ententesemployeurs:modal.internshipInfo')}
                                 </h4>

                                 <div className="space-y-4 text-sm text-gray-700">
                                     <div>
                                         <strong>{t('fields.title')}:</strong>
                                         <div className="mt-1 font-medium text-gray-900">{selectedEntente.titre || '-'}</div>
                                     </div>

                                     <div>
                                         <strong>{t('fields.description')}:</strong>
                                         <div className="mt-1 text-gray-800">{selectedEntente.description || '-'}</div>
                                         <div className="mt-1 text-gray-800">{(selectedEntente as any).description || '-'}</div>
                                     </div>

                                     <div className="grid md:grid-cols-2 gap-3">
                                         <div>
                                             <div className="text-sm text-gray-600">{t('fields.program')}</div>
                                             <div className="font-medium text-gray-900">{resolveField(selectedEntente as any, 'progEtude', 'prog', 'progEtudes', 'programme') || '-'}</div>
                                         </div>
                                         <div>
                                             <div className="text-sm text-gray-600">{t('fields.location')}</div>
                                             <div className="font-medium text-gray-900">{resolveField(selectedEntente as any, 'lieuStage', 'lieu', 'lieu_stage', 'location') || '-'}</div>
                                         </div>

                                         <div>
                                             <div className="text-sm text-gray-600">{t('fields.schedule')}</div>
                                             <div className="font-medium text-gray-900">{resolveField(selectedEntente as any, 'horaire', 'schedule') || '-'}</div>
                                         </div>
                                         <div>
                                             <div className="text-sm text-gray-600">{t('fields.weeklyHours')}</div>
                                             <div className="font-medium text-gray-900">{resolveField(selectedEntente as any, 'dureeHebdomadaire', 'duree_hebdomadaire') ?? '-'}</div>
                                         </div>

                                         <div>
                                             <div className="text-sm text-gray-600">{t('fields.remuneration')}</div>
                                             <div className="font-medium text-gray-900">{resolveField(selectedEntente as any, 'remuneration', 'salaire', 'salaireHoraire') || '-'}</div>
                                         </div>

                                         <div>
                                             <div className="text-sm text-gray-600">{t('fields.period')}</div>
                                             <div className="font-medium text-gray-900">{selectedEntente.dateDebut || (selectedEntente as any).dateDebut || '-'} → {selectedEntente.dateFin || (selectedEntente as any).dateFin || '-'}</div>
                                             <div className="font-medium text-gray-900">{resolveField(selectedEntente as any, 'dateDebut', 'date_debut') || '-'} → {resolveField(selectedEntente as any, 'dateFin', 'date_fin') || '-'}</div>
                                         </div>
                                     </div>

                                     <div>
                                         <div className="text-sm text-gray-600">{t('fields.responsibilities')}</div>
                                         <div className="mt-1 text-gray-800">{selectedEntente.responsabilites || '-'}</div>
                                         <div className="mt-1 text-gray-800">{(selectedEntente as any).responsabilites || '-'}</div>
                                     </div>

                                     <div>
                                         <div className="text-sm text-gray-600">{t('fields.objectives')}</div>
                                         <div className="mt-1 text-gray-800">{selectedEntente.objectifs || '-'}</div>
                                         <div className="mt-1 text-gray-800">{(selectedEntente as any).objectifs || '-'}</div>
                                     </div>

                                     <div className="pt-2 border-t border-blue-100">
                                         <h5 className="text-sm font-medium text-gray-700">{t('ententesemployeurs:modal.student')}</h5>
                                         <p className="font-semibold text-gray-900">{selectedEntente.etudiantPrenom} {selectedEntente.etudiantNom}</p>
                                         <p className="text-xs text-gray-600">{selectedEntente.etudiantEmail}</p>

                                         <h5 className="mt-3 text-sm font-medium text-gray-700">{t('ententesemployeurs:modal.employer')}</h5>
                                         <p className="font-semibold text-gray-900">{selectedEntente.employeurNom || ''}</p>
                                     </div>
                                 </div>
                             </div>

                             {/* Footer actions */}
                             <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 rounded-b-2xl flex gap-3 justify-end">
                                <button
                                    onClick={async () => {
                                        try {
                                            const blob = await employeurService.telechargerPdfEntente(selectedEntente.id);
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                            setTimeout(() => URL.revokeObjectURL(url), 10000);
                                        } catch (err: any) {
                                            setError(err.message || t('ententesemployeurs:errors.pdfError'));
                                        }
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    {t('ententesemployeurs:viewPdf')}
                                </button>

                             </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* Modal de refus */}
             {showRefuseModal && selectedEntente && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                     <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                         <div className="bg-red-50 px-6 py-4 rounded-t-2xl border-b border-red-100">
                             <h3 className="text-xl font-bold text-red-900">
                                 {t("ententesemployeurs:refuseModal.title")}
                             </h3>
                         </div>
                         <div className="p-6">
                             <p className="text-gray-700 mb-4">
                                 {t("ententesemployeurs:refuseModal.message")}
                             </p>
                         </div>
                         <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
                             <button
                                 onClick={() => {
                                     setShowRefuseModal(false);
                                     setShowModal(true);
                                 }}
                                 className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                             >
                                 {t("ententesemployeurs:refuseModal.cancel")}
                             </button>
                             <button
                                 onClick={async () => {
                                     // confirm refuse: call API and update local state
                                     setActionLoading(true);
                                     try {
                                         await employeurService.refuserEntente(selectedEntente.id);
                                         // update local list so the item remains visible but marked refused
                                         setEntentes(prev => prev.map(e => e.id === selectedEntente.id ? { ...e, employeurSignature: 'REFUSEE' } : e));
                                         setSuccessMessage(t('ententesemployeurs:messages.refused'));
                                     } catch (err: any) {
                                         setError(err.message || t('ententesemployeurs:errors.refuseError'));
                                     } finally {
                                         setActionLoading(false);
                                         setShowRefuseModal(false);
                                         setSelectedEntente(null);
                                     }
                                 }}
                                 disabled={actionLoading}
                                 className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                             >
                                 {actionLoading ? t("ententesemployeurs:refuseModal.loading") : t("ententesemployeurs:refuseModal.confirm")}
                             </button>
                         </div>
                     </div>
                 </div>
             )}

            {/* Confirmation modal for signing (employeur) */}
            {showSignConfirm && selectedEntente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{t('ententesemployeurs:confirmSign.title') || 'Confirmer signature'}</h3>
                        <p className="text-gray-700 mb-6 text-center">{t('ententesemployeurs:confirmSign.message') || 'Voulez-vous vraiment signer cette entente ?'}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowSignConfirm(false); setSelectedEntente(null); }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {t('buttons.cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    setActionLoading(true);
                                    try {
                                        await employeurService.signerEntente(selectedEntente.id);
                                        setEntentes(prev => prev.map(e => e.id === selectedEntente.id ? { ...e, employeurSignature: 'SIGNEE' } : e));
                                        setSuccessMessage(t('ententesemployeurs:messages.signed'));
                                    } catch (err: any) {
                                        setError(err.message || t('ententesemployeurs:errors.signError'));
                                    } finally {
                                        setActionLoading(false);
                                        setShowSignConfirm(false);
                                        setSelectedEntente(null);
                                    }
                                }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    t('buttons.confirm')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntentesEmployeurs;

