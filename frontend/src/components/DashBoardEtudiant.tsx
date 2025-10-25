import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, X, Upload, FileText, Calendar, MapPin, Bell, FileSignature } from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar.tsx";
import OffresApprouvees from "./OffresApprouvees.tsx";
import etudiantService from '../services/EtudiantService.ts';
import type { ConvocationDTO } from '../services/EtudiantService.ts';

const DashBoardEtudiant = () => {
    const { t } = useTranslation('dashboardEtudiant');
    const navigate = useNavigate();
    const [userFullName, setUserFullName] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning'>('success');
    const [convocations, setConvocations] = useState<ConvocationDTO[]>([]);
    const [selectedConvocation, setSelectedConvocation] = useState<ConvocationDTO | null>(null);
    const [loadingConvocations, setLoadingConvocations] = useState(false);
    const [previousConvocations, setPreviousConvocations] = useState<ConvocationDTO[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

    // Fonction pour afficher une notification
    const showNotif = (message: string, type: 'success' | 'info' | 'warning' = 'success', notifId?: string) => {
        // Ne pas afficher si déjà dismissée
        if (notifId && dismissedNotifications.has(notifId)) {
            return;
        }

        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);

        // Sauvegarder dans sessionStorage pour persistance
        if (notifId) {
            sessionStorage.setItem('pendingNotification', JSON.stringify({ message, type, id: notifId }));
        }
    };

    // Fonction pour fermer et marquer comme dismissée
    const handleCloseNotification = () => {
        setShowNotification(false);

        // Marquer comme dismissée
        const pending = sessionStorage.getItem('pendingNotification');
        if (pending) {
            const notif = JSON.parse(pending);
            if (notif.id) {
                const newDismissed = new Set(dismissedNotifications);
                newDismissed.add(notif.id);
                setDismissedNotifications(newDismissed);

                // Sauvegarder les notifications dismissées
                sessionStorage.setItem('dismissedNotifications', JSON.stringify(Array.from(newDismissed)));
            }
            sessionStorage.removeItem('pendingNotification');
        }
    };

    // Fonction pour charger les convocations
    const loadConvocations = async (isPolling = false) => {
        try {
            if (!isPolling) setLoadingConvocations(true);
            const convs = await etudiantService.getConvocations();

            // Vérifier s'il y a de nouvelles convocations ou des modifications
            if (isPolling && previousConvocations.length > 0) {
                const newConvs = convs || [];

                // Nouvelle convocation
                if (newConvs.length > previousConvocations.length) {
                    const notifId = `new-convocation-${Date.now()}`;
                    showNotif('🔔 Vous avez reçu une nouvelle convocation d\'entrevue !', 'info', notifId);
                } else if (newConvs.length === previousConvocations.length && newConvs.length > 0) {
                    // Vérifier les modifications
                    for (let i = 0; i < newConvs.length; i++) {
                        const newConv = newConvs[i];
                        const oldConv = previousConvocations.find(c => c.id === newConv.id);

                        if (oldConv) {
                            if (oldConv.dateHeure !== newConv.dateHeure ||
                                oldConv.lieuOuLien !== newConv.lieuOuLien ||
                                oldConv.message !== newConv.message) {
                                const notifId = `modified-convocation-${newConv.id}-${Date.now()}`;
                                showNotif('📝 Une de vos convocations a été modifiée', 'warning', notifId);
                                break;
                            }
                        }
                    }
                }
            }

            setConvocations(convs || []);
            setPreviousConvocations(convs || []);
        } catch (e) {
            console.error('Erreur chargement convocations:', e);
        } finally {
            if (!isPolling) setLoadingConvocations(false);
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "ETUDIANT") {
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
                if (fullName) {
                    setUserFullName(fullName);
                }
            }
        } catch (e) {
            console.warn('Unable to parse userData', e);
        }

        // Charger les notifications dismissées
        const dismissed = sessionStorage.getItem('dismissedNotifications');
        if (dismissed) {
            setDismissedNotifications(new Set(JSON.parse(dismissed)));
        }

        // Vérifier s'il y a une notification en attente
        const pending = sessionStorage.getItem('pendingNotification');
        if (pending) {
            const notif = JSON.parse(pending);
            showNotif(notif.message, notif.type, notif.id);
        }

        const fromRegistration = sessionStorage.getItem('fromRegistration');
        if (fromRegistration === 'true') {
            showNotif(t('notifications.registration'));
            sessionStorage.removeItem('fromRegistration');
        }

        // Nettoyer le flag de login sans afficher de notification
        sessionStorage.removeItem('fromLogin');

        // Charger les convocations initialement
        loadConvocations(false).then();

        // Polling pour vérifier les nouvelles convocations toutes les 30 secondes
        const pollingInterval = setInterval(() => {
            loadConvocations(true).then();
        }, 30000);

        return () => clearInterval(pollingInterval);
    }, [navigate, t]);

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

    const handleNavigateToCv = () => {
        navigate("/televersement-cv");
    };

    const getConvocationStatusBadge = (statut?: string) => {
        switch (statut) {
            case 'CONVOQUEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('dashboardEtudiant:convocations.convoquee')}
                    </span>
                );
            case 'MODIFIE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Bell className="w-4 h-4 mr-1" />
                        {t('dashboardEtudiant:convocations.modifie')}
                    </span>
                );
            case 'ANNULEE':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <X className="w-4 h-4 mr-1" />
                        {t('dashboardEtudiant:convocations.annulee')}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar/>

            {showNotification && (
                <div className="fixed top-24 right-4 z-50 max-w-md w-full animate-slide-in">
                    <div className={`${getNotificationColor()} border rounded-xl p-4 shadow-lg`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {getNotificationIcon()}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium">
                                    {notificationMessage}
                                </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseNotification}
                                    className="cursor-pointer rounded-md inline-flex hover:opacity-70 focus:outline-none"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('welcome')}{userFullName && `, ${userFullName}`}!
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <button
                        onClick={handleNavigateToCv}
                        className="cursor-pointer bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 border border-slate-200 transition-all duration-200 text-left group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <Upload className="h-7 w-7 text-blue-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('cards.cv.title')}
                        </h2>
                        <p className="text-gray-600">
                            {t('cards.cv.description')}
                        </p>
                    </button>

                    <button
                        onClick={() => navigate("/mes-candidatures")}
                        className="cursor-pointer bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 border border-slate-200 transition-all duration-200 text-left group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-purple-50 p-4 rounded-xl group-hover:bg-purple-100 transition-colors">
                                <FileText className="h-7 w-7 text-purple-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('cards.applications.title')}
                        </h2>
                        <p className="text-gray-600">
                            {t('cards.applications.description')}
                        </p>
                    </button>

                    <button
                        onClick={() => navigate("/mes-ententes-stage")}
                        className="cursor-pointer bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 border border-slate-200 transition-all duration-200 text-left group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-green-50 p-4 rounded-xl group-hover:bg-green-100 transition-colors">
                                <FileSignature className="h-7 w-7 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Ententes de stage
                        </h2>
                        <p className="text-gray-600">
                            Consultez et signez vos ententes de stage
                        </p>
                    </button>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                {t('offers.title')}
                            </h2>
                            <p className="text-gray-600">
                                {t('offers.subtitle')}
                            </p>
                        </div>
                    </div>

                    <OffresApprouvees />
                </div>

                {/* Convocations section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{t('convocations.title') || 'Convocations'}</h2>
                        <button
                            onClick={async () => {
                                setLoadingConvocations(true);
                                try { const convs = await etudiantService.getConvocations(); setConvocations(convs || []); }
                                finally { setLoadingConvocations(false); }
                            }}
                            className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
                        >
                            {t('convocations.refresh') || 'Refresh'}
                        </button>
                    </div>

                {loadingConvocations ? (
                    <div className="text-sm text-gray-600">{t('convocations.loading') || 'Loading convocations...'}</div>
                ) : convocations.length === 0 ? (
                    <div className="text-sm text-gray-500">{t('convocations.empty') || 'No convocations at the moment.'}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {convocations.map(c => (
                            <div
                                key={c.id}
                                className={`relative bg-white p-6 rounded-2xl border ${c.statut === 'CONVOQUEE' ? 'ring-1 ring-green-100' : c.statut === 'MODIFIE' ? 'ring-1 ring-yellow-100' : c.statut === 'ANNULEE' ? 'ring-1 ring-red-100' : 'ring-1 ring-slate-50'} shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all`}
                            >
                                <div className="absolute -top-3 left-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${c.statut === 'CONVOQUEE' ? 'bg-green-50 text-green-700' : c.statut === 'MODIFIE' ? 'bg-yellow-50 text-yellow-700' : c.statut === 'ANNULEE' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'}`}>
                                        {(t(`convocations.${(c.statut ? c.statut.toLowerCase() : 'unknown')}`))}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm text-gray-500">{new Date(c.dateHeure).toLocaleDateString()} · {new Date(c.dateHeure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                {c.offreTitre && <p className="text-md font-semibold text-gray-900 truncate">{c.offreTitre}</p>}
                                            </div>
                                            <div className="ml-4 text-right">
                                                <button
                                                    onClick={() => setSelectedConvocation(c)}
                                                    aria-label={t('convocations.view') || 'Voir la convocation'}
                                                    className="cursor-pointer inline-flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-base font-semibold hover:opacity-90 transition transform hover:-translate-y-1"
                                                >
                                                    {t('convocations.view') || 'Voir'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 text-sm text-gray-600 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="truncate">{c.lieuOuLien || t('convocations.locationUnknown')}</span>
                                            </div>
                                            {c.employeurNom && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs uppercase tracking-wide text-gray-500">{t('convocations.employer') || 'Employeur'}</span>
                                                    <span className="text-sm text-gray-700 font-medium truncate">{c.employeurNom}</span>
                                                </div>
                                            )}
                                            {c.message && <p className="text-sm text-gray-700 max-h-14 overflow-hidden">{c.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            </div>

            {/* Convocation modal */}
            {selectedConvocation && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold">{selectedConvocation.offreTitre || t('convocations.title')}</h3>
                                    {selectedConvocation.statut && getConvocationStatusBadge(selectedConvocation.statut)}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{new Date(selectedConvocation.dateHeure).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedConvocation(null)} className="cursor-pointer text-gray-500">{t('convocations.close') || 'Close'}</button>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-gray-700">{selectedConvocation.message}</p>
                            <p className="text-sm text-gray-600 mt-3"><strong>{t('convocations.location') || 'Location'}:</strong> {selectedConvocation.lieuOuLien}</p>
                            {selectedConvocation.employeurNom && <p className="text-sm text-gray-600 mt-1"><strong>{t('convocations.employer') || 'Employer'}:</strong> {selectedConvocation.employeurNom}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashBoardEtudiant;