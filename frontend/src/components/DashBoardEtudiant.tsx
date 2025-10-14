import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, X, Upload, FileText } from "lucide-react";
import { useTranslation } from 'react-i18next';
import NavBar from "./NavBar.tsx";
import OffresApprouvees from "./OffresApprouvees.tsx";

const DashBoardEtudiant = () => {
    const { t } = useTranslation('dashboardEtudiant');
    const navigate = useNavigate();
    const [userFullName, setUserFullName] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

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

        const fromRegistration = sessionStorage.getItem('fromRegistration');

        if (fromRegistration === 'true') {
            setNotificationMessage(t('notifications.registration'));
            setShowNotification(true);
            sessionStorage.removeItem('fromRegistration');
        }

        // Nettoyer le flag de login sans afficher de notification
        sessionStorage.removeItem('fromLogin');

        if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [navigate, showNotification, t]);

    const handleCloseNotification = () => {
        setShowNotification(false);
    };

    const handleNavigateToCv = () => {
        navigate("/televersement-cv");
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar/>

            {showNotification && (
                <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-slide-in">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-green-800">
                                    {notificationMessage}
                                </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseNotification}
                                    className="bg-green-50 rounded-md inline-flex text-green-400 hover:text-green-500 focus:outline-none"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <button
                        onClick={handleNavigateToCv}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 border border-slate-200 transition-all duration-200 text-left group"
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
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 border border-slate-200 transition-all duration-200 text-left group"
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
            </div>
        </div>
    );
};

export default DashBoardEtudiant;