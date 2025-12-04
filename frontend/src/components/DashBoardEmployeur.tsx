import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { employeurService } from "../services/EmployeurService";
import { Building, Calendar, MapPin, CheckCircle, X, GraduationCap, Clock, Edit, Trash2, RefreshCw, FileSignature, Bell } from 'lucide-react';
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";
import { useYear } from "./YearContext/YearContext.tsx";
import YearBanner from "./YearBanner/YearBanner.tsx";

// Helper function to determine academic year
const getCurrentYear = (): number => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return currentMonth >= 7 ? currentYear + 1 : currentYear;
};

interface ConvocationEntrevueDTO {
    id?: number;
    candidatureId: number;
    dateHeure: string;
    lieuOuLien: string;
    message: string;
    offreTitre?: string;
    statut: 'CONVOQUEE' | 'MODIFIE' | 'ANNULEE';
    employeurNom?: string;
    etudiantNom?: string;
    etudiantPrenom?: string;
}

const DashBoardEmployeur = () => {
    const { t, i18n } = useTranslation(["employerdashboard"]);
    const { t: tProgrammes } = useTranslation('programmes');
    const navigate = useNavigate();
    const { selectedYear } = useYear();
    const currentYear = getCurrentYear();
    const isViewingPastYear = selectedYear < currentYear;

    const [userFullName, setUserFullName] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning'>('success');
    const [offres, setOffres] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalReason, setModalReason] = useState("");
    const [convocations, setConvocations] = useState<ConvocationEntrevueDTO[]>([]);
    const [loadingConvocations, setLoadingConvocations] = useState(false);
    const [selectedConvocation, setSelectedConvocation] = useState<ConvocationEntrevueDTO | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ dateHeure: '', lieuOuLien: '', message: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [convocationToDelete, setConvocationToDelete] = useState<ConvocationEntrevueDTO | null>(null);

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }

        // Récupérer le nom complet de l'utilisateur
        try {
            const userData = sessionStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                const prenom = user.prenom || '';
                const nom = user.nom || '';
                const fullName = `${prenom} ${nom}`.trim();
                if (fullName) setUserFullName(fullName);
            }
        } catch (e) {
            console.warn('Unable to parse userData', e);
        }

        const token = sessionStorage.getItem("authToken");
        if (token) {
            employeurService.getOffresParEmployeur(token, selectedYear)
                .then(offres => setOffres(offres))
                .catch(() => {
                    setNotificationMessage(t("employerdashboard:errors.loadOffers"));
                    setNotificationType('warning');
                    setShowNotification(true);
                });
        }
        loadConvocations().then();

        const fromRegistration = sessionStorage.getItem('fromRegistration');
        const fromLogin = sessionStorage.getItem('fromLogin');

        if (fromRegistration === 'true') {
            setNotificationMessage(t('employerdashboard:notifications.welcomeCreated'));
            setNotificationType('success');
            setShowNotification(true);
            sessionStorage.removeItem('fromRegistration');
        } else if (fromLogin === 'true') {
            setNotificationMessage(t('employerdashboard:notifications.welcomeLogin'));
            setNotificationType('success');
            setShowNotification(true);
            sessionStorage.removeItem('fromLogin');
        }

        // no automatic timeout; user closes via X
    }, [navigate, t, selectedYear]);

    const loadConvocations = async () => {
        try {
            setLoadingConvocations(true);
            const convs = await employeurService.getConvocations(selectedYear);
            setConvocations(convs || []);
        } catch (e) {
            console.error('Erreur chargement convocations:', e);
        } finally {
            setLoadingConvocations(false);
        }
    };

    const getNotificationColor = () => {
        switch (notificationType) {
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default:
                return 'bg-green-50 border-green-200 text-green-800';
        }
    };

    const getNotificationIcon = () => {
        switch (notificationType) {
            case 'info':
                return <Bell className="h-5 w-5 text-blue-600" />;
            case 'warning':
                return <Bell className="h-5 w-5 text-yellow-600" />;
            default:
                return <CheckCircle className="h-5 w-5 text-green-600" />;
        }
    };

    const handleCloseNotification = () => {
        setShowNotification(false);
        setNotificationMessage('');
    };

    const handleRefuseClick = (reason: string) => {
        setModalReason(reason || t('employerdashboard:convocations.noReasonProvided'));
        setShowModal(true);
    };

    const handleEditConvocation = (conv: ConvocationEntrevueDTO) => {
        if (isViewingPastYear) return;
        setSelectedConvocation(conv);
        setEditForm({ dateHeure: conv.dateHeure, lieuOuLien: conv.lieuOuLien, message: conv.message });
        setShowEditModal(true);
    };

    const resetEditModalState = () => {
        setSelectedConvocation(null);
        setEditForm({ dateHeure: '', lieuOuLien: '', message: '' });
    };

    const handleSaveEdit = async () => {
        if (!selectedConvocation || isViewingPastYear) return;

        try {
            await employeurService.modifierConvocation(selectedConvocation.candidatureId, editForm);
            setNotificationMessage(t('employerdashboard:convocations.messages.edited'));
            setNotificationType('success');
            setShowNotification(true);
            setShowEditModal(false);
            resetEditModalState();
            await loadConvocations();
        } catch (error: any) {
            setNotificationMessage(error.message || t('employerdashboard:convocations.messages.editError'));
            setNotificationType('warning');
            setShowNotification(true);
        }
    };

    const handleDeleteConvocation = async (conv: ConvocationEntrevueDTO) => {
        if (isViewingPastYear) return;
        setConvocationToDelete(conv);
        setShowDeleteModal(true);
    };

    const confirmDeleteConvocation = async () => {
        if (!convocationToDelete) return;
        try {
            await employeurService.annulerConvocation(convocationToDelete.candidatureId);
            setNotificationMessage(t('employerdashboard:convocations.messages.deleted'));
            setNotificationType('success');
            setShowNotification(true);
            await loadConvocations();
        } catch (error: any) {
            setNotificationMessage(error.message || t('employerdashboard:convocations.messages.deleteError'));
            setNotificationType('warning');
            setShowNotification(true);
        } finally {
            setShowDeleteModal(false);
            setConvocationToDelete(null);
        }
    };


    // handler inlined where used to avoid unused-variable TS warning

    // Badge pour le statut d'une convocation
    const getConvocationStatusBadge = (statut: string | undefined) => {
        if (!statut) return null;
        switch (statut) {
            case 'CONVOQUEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('employerdashboard:convocations.convoked')}
                    </span>
                );
            case 'MODIFIE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        {t('employerdashboard:convocations.modified')}
                    </span>
                );
            case 'ANNULEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <X className="w-4 h-4 mr-1" />
                        {t('employerdashboard:convocations.cancelled')}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <NavBar />

            {showNotification && (
                <div className="fixed top-24 right-4 z-50 max-w-md w-full animate-slide-in">
                    <div className={`${getNotificationColor()} border rounded-xl p-4 shadow-lg`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">{getNotificationIcon()}</div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium">{notificationMessage}</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button type="button" onClick={handleCloseNotification} className="cursor-pointer rounded-md inline-flex hover:opacity-70 focus:outline-none">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">{t('employerdashboard:title')}{userFullName && `, ${userFullName}`}!</h1>
                    <p className="text-gray-600 dark:text-slate-300">{t('employerdashboard:subtitle') || ''}</p>
                </div>

                {isViewingPastYear && (
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <YearBanner />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <NavLink to={isViewingPastYear ? '#' : '/offre-stage'} onClick={(e) => { if (isViewingPastYear) { e.preventDefault(); return; } }} className={`group ${isViewingPastYear ? 'opacity-60 cursor-not-allowed' : ''} bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-400/50 transition-all duration-300 transform hover:scale-105 p-6`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white/20 rounded-xl p-3 flex items-center justify-center"><Building className="w-8 h-8" /></div>
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors"><span className="text-xs font-bold">→</span></div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t("employerdashboard:createOffer")}</h3>
                        <p className="text-blue-100 text-sm">{t('employerdashboard:createOfferSubtitle') || ''}</p>
                    </NavLink>

                    <NavLink to="/candidatures-recues" className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-purple-400/50 transition-all duration-300 transform hover:scale-105 p-6">
                        <div className="flex items-center justify-between mb-4"><Calendar className="w-10 h-10" /><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors"><span className="text-xs font-bold">→</span></div></div>
                        <h3 className="text-xl font-bold mb-2">{t("employerdashboard:myApplications")}</h3>
                        <p className="text-purple-100 text-sm">{t('employerdashboard:applicationsSubtitle') || ''}</p>
                    </NavLink>

                    <NavLink to="/mes-ententes" className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-green-400/50 transition-all duration-300 transform hover:scale-105 p-6">
                        <div className="flex items-center justify-between mb-4"><FileSignature className="w-10 h-10" /><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors"><span className="text-xs font-bold">→</span></div></div>
                        <h3 className="text-xl font-bold mb-2">{t("employerdashboard:myAgreements")}</h3>
                        <p className="text-green-100 text-sm">{t('employerdashboard:agreementsSubtitle') || ''}</p>
                    </NavLink>

                    <NavLink to="/evaluation-stagiaire" className="group bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-amber-400/50 transition-all duration-300 transform hover:scale-105 p-6">
                        <div className="flex items-center justify-between mb-4"><GraduationCap className="w-10 h-10" /><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors"><span className="text-xs font-bold">→</span></div></div>
                        <h3 className="text-xl font-bold mb-2">{t("employerdashboard:evaluateInterns")}</h3>
                        <p className="text-amber-100 text-sm">{t('employerdashboard:evaluateSubtitle') || ''}</p>
                    </NavLink>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">{t('employerdashboard:convocations.title')}</h2>
                            <p className="text-gray-600 dark:text-slate-300">{t('employerdashboard:convocations.subtitle') || ''}</p>
                        </div>
                        <button onClick={loadConvocations} className="cursor-pointer text-sm text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-100 flex items-center gap-2" disabled={loadingConvocations}><RefreshCw className={`w-4 h-4 ${loadingConvocations ? 'animate-spin' : ''}`} />{t('employerdashboard:convocations.refresh')}</button>
                    </div>

                    {loadingConvocations ? (
                        <div className="text-center py-8 text-gray-600 dark:text-slate-300">{t('employerdashboard:convocations.loading')}</div>
                    ) : convocations.length === 0 ? (
                        <div className="text-center py-12"><Clock className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" /><p className="text-gray-500 dark:text-slate-400">{t('employerdashboard:convocations.noneTitle')}</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {convocations.map(conv => (
                                <div key={conv.id} className={`relative bg-white dark:bg-slate-800 p-6 rounded-2xl border ${conv.statut === 'CONVOQUEE' ? 'ring-1 ring-green-100' : conv.statut === 'MODIFIE' ? 'ring-1 ring-yellow-100' : conv.statut === 'ANNULEE' ? 'ring-1 ring-red-100' : 'ring-1 ring-slate-50'} shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all`}>
                                    <div className="absolute -top-3 left-4">{getConvocationStatusBadge(conv.statut)}</div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/30 dark:to-slate-800 flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-600" /></div></div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0"><p className="text-sm text-gray-500 dark:text-slate-400">{new Date(conv.dateHeure).toLocaleDateString()} · {new Date(conv.dateHeure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>{conv.offreTitre && <p className="text-md font-semibold text-gray-900 dark:text-slate-100 truncate">{conv.offreTitre}</p>}</div>
                                                <div className="ml-4 text-right flex flex-col gap-2">
                                                    {conv.statut !== 'ANNULEE' && !isViewingPastYear && (
                                                        <>
                                                            <button onClick={() => handleEditConvocation(conv)} aria-label={t('employerdashboard:convocations.edit') || 'Edit'} className="cursor-pointer inline-flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition transform hover:-translate-y-1"><Edit className="w-4 h-4" />{t('employerdashboard:convocations.edit')}</button>
                                                            <button onClick={() => handleDeleteConvocation(conv)} aria-label={t('employerdashboard:convocations.delete') || 'Delete'} className="cursor-pointer inline-flex items-center gap-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition transform hover:-translate-y-1"><Trash2 className="w-4 h-4" />{t('employerdashboard:convocations.delete')}</button>
                                                        </>
                                                    )}
                                                    {conv.statut !== 'ANNULEE' && isViewingPastYear && (
                                                        <>
                                                            <button disabled className="px-4 py-2 rounded-xl bg-gray-300 text-gray-600 text-sm">{t('employerdashboard:convocations.edit')}</button>
                                                            <button disabled className="px-4 py-2 rounded-xl bg-gray-300 text-gray-600 text-sm">{t('employerdashboard:convocations.delete')}</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 text-sm text-gray-600 dark:text-slate-300 flex flex-col gap-2">
                                                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /><span className="truncate">{conv.lieuOuLien || t('employerdashboard:convocations.locationUnknown')}</span></div>
                                                {conv.etudiantPrenom && conv.etudiantNom && (<div className="flex items-center gap-2"><span className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">{t('employerdashboard:convocations.student') || 'Etudiant'}</span><span className="text-sm text-gray-700 dark:text-slate-200 font-medium truncate">{conv.etudiantPrenom} {conv.etudiantNom}</span></div>)}
                                                {conv.message && <p className="text-sm text-gray-700 dark:text-slate-200 max-h-14 overflow-hidden">{conv.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Offres Section (kept below convocations) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 mt-6">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-6">{t("employerdashboard:myOffers")}</h2>

                    {offres.length === 0 ? (
                        <div className="text-center py-12"><div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"><Building className="w-10 h-10 text-gray-400 dark:text-slate-500" /></div><p className="text-gray-500 dark:text-slate-400 text-lg">{t("employerdashboard:noOffers.title")}</p><p className="text-gray-400 dark:text-slate-500 text-sm mt-2">{t("employerdashboard:noOffers.subtitle")}</p></div>
                    ) : (
                        <div className="space-y-6">
                            {offres.map((offre, index) => {
                                const statutApprouve = offre.statutApprouve || 'ATTENTE';
                                const isRefused = statutApprouve === 'REFUSE';
                                const isApproved = statutApprouve === 'APPROUVE';

                                return (
                                    <div key={index} className={`border-2 rounded-xl p-6 transition-all duration-300 ${isRefused ? 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 cursor-pointer hover:shadow-lg' : isApproved ? 'border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg' : 'border-yellow-200 dark:border-yellow-900/40 bg-yellow-50 dark:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-800 hover:shadow-lg'}`} onClick={() => isRefused && handleRefuseClick(offre.messageRefus)}>
                                        <div className="flex justify-between items-start mb-4"><div className="flex-1"><h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">{offre.titre}</h3><p className="text-gray-600 dark:text-slate-300 text-sm flex items-center mb-1"><Building className="w-4 h-4 mr-2" />{offre.employeurDTO?.nomEntreprise}</p>{offre.lieuStage && (<p className="text-gray-600 dark:text-slate-300 text-sm flex items-center mb-1"><MapPin className="w-4 h-4 mr-2" />{offre.lieuStage}</p>)}{offre.progEtude && (<p className="text-gray-600 dark:text-slate-300 text-sm flex items-center"><GraduationCap className="w-4 h-4 mr-2" />{tProgrammes(offre.progEtude)}</p>)}</div><span className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 ml-4 ${isRefused ? 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200' : isApproved ? 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-200' : 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'}`}>{isRefused ? t("employerdashboard:status.refused") : isApproved ? t("employerdashboard:status.approved") : t("employerdashboard:status.pending")}</span></div><p className="text-gray-700 dark:text-slate-300 mb-4">{offre.description}</p><div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-300"><span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{t("employerdashboard:start")} : {offre.date_debut}</span><span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{t("employerdashboard:end")} : {offre.date_fin}</span></div>{isRefused && (<div className="mt-4 text-sm text-red-600 dark:text-red-300 font-medium">{t("employerdashboard:clickToSeeRefuseReason")}</div>)}</div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Convocation Modal */}
            {showEditModal && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
                        <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-4 rounded-t-xl border-b border-blue-100 dark:border-blue-800"><h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">{t('employerdashboard:convocations.editModal.title')}</h3></div>
                        <div className="px-6 py-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{t('employerdashboard:convocations.editModal.dateTime')}</label>
                                <input type="datetime-local" value={editForm.dateHeure} onChange={(e) => setEditForm({...editForm, dateHeure: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{t('employerdashboard:convocations.editModal.location')}</label>
                                <input type="text" value={editForm.lieuOuLien} onChange={(e) => setEditForm({...editForm, lieuOuLien: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{t('employerdashboard:convocations.editModal.message')}</label>
                                <textarea value={editForm.message} onChange={(e) => setEditForm({...editForm, message: e.target.value})} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 rounded-b-xl flex justify-end gap-3">
                            <button className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => { setShowEditModal(false); resetEditModalState(); }}>{t('employerdashboard:convocations.editModal.cancel')}</button>
                            <button className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleSaveEdit}>{t('employerdashboard:convocations.editModal.save')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Convocation Modal */}
            {showDeleteModal && convocationToDelete && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
                        <div className="bg-red-50 dark:bg-red-900/30 px-6 py-4 rounded-t-xl border-b border-red-100 dark:border-red-800"><div className="flex items-center"><div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mr-3"><Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" /></div><h3 className="text-xl font-semibold text-red-700 dark:text-red-300">{t('employerdashboard:convocations.deleteModal.title')}</h3></div></div>
                        <div className="px-6 py-6"><p className="text-gray-700 dark:text-slate-200 mb-4">{t('employerdashboard:convocations.deleteModal.message')}</p><div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600"><p className="font-semibold text-gray-800 dark:text-slate-100 mb-2">{convocationToDelete.offreTitre || t('employerdashboard:convocations.defaultTitle')}</p><p className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(convocationToDelete.dateHeure).toLocaleString(i18n?.language?.startsWith('fr') ? 'fr-CA' : 'en-CA', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})}</p>{convocationToDelete.etudiantNom && convocationToDelete.etudiantPrenom && (<p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{t('employerdashboard:convocations.student')}: {convocationToDelete.etudiantPrenom} {convocationToDelete.etudiantNom}</p>)}</div><p className="text-sm text-red-600 dark:text-red-400 mt-4 font-medium">{t('employerdashboard:convocations.deleteModal.warning')}</p></div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 rounded-b-xl flex justify-end gap-3"><button className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600" onClick={() => { setShowDeleteModal(false); setConvocationToDelete(null); }}>{t('employerdashboard:convocations.deleteModal.cancel')}</button><button className="cursor-pointer px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onClick={confirmDeleteConvocation}>{t('employerdashboard:convocations.deleteModal.confirm')}</button></div>
                    </div>
                </div>
            )}

            {/* Refusal Reason Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
                        <div className="bg-red-50 px-6 py-4 rounded-t-xl border-b border-red-100"><div className="flex items-center justify-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3"><X className="w-6 h-6 text-red-600" /></div><h3 className="text-xl font-semibold text-red-700">{t("employerdashboard:modal.refusedTitle")}</h3></div></div>
                        <div className="px-6 py-6"><p className="text-gray-600 text-sm mb-2">{t("employerdashboard:modal.refusedReason")}</p><div className="bg-gray-50 p-4 rounded-lg border"><p className="text-gray-800 leading-relaxed">{modalReason}</p></div></div>
                        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end"><button className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200" onClick={() => { setShowModal(false); setModalReason(''); }}>{t("employerdashboard:modal.close")}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashBoardEmployeur;