import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, X, Upload, FileText } from "lucide-react";
import NavBar from "./NavBar.tsx";
import OffresApprouvees from "./OffresApprouvees.tsx";

const DashBoardEtudiant = () => {
    const navigate = useNavigate();
    useLocation();
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "ETUDIANT") {
            navigate("/login");
            return;
        }

        // Vérifier si l'utilisateur vient d'une inscription ou connexion réussie
        const fromRegistration = sessionStorage.getItem('fromRegistration');
        const fromLogin = sessionStorage.getItem('fromLogin');

        if (fromRegistration === 'true') {
            setNotificationMessage('Bienvenue ! Votre compte a été créé et vous êtes connecté avec succès.');
            setShowNotification(true);
            sessionStorage.removeItem('fromRegistration');
        } else if (fromLogin === 'true') {
            setNotificationMessage('Connexion réussie ! Bienvenue sur votre tableau de bord.');
            setShowNotification(true);
            sessionStorage.removeItem('fromLogin');
        }

        // Auto-fermer la notification après 5 secondes
        if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [navigate, showNotification]);

    const handleCloseNotification = () => {
        setShowNotification(false);
    };

    const handleNavigateToCv = () => {
        navigate("/televersement-cv");
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar/>

            {/* Notification de succès */}
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
                {/* En-tête du dashboard */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bienvenue sur votre espace étudiant 👋
                    </h1>
                    <p className="text-gray-600">
                        Gérez votre profil et découvrez les opportunités de stage disponibles
                    </p>
                </div>

                {/* Actions rapides */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Carte CV */}
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
                            Mon CV
                        </h2>
                        <p className="text-gray-600">
                            Téléversez ou mettez à jour votre curriculum vitae pour postuler aux offres
                        </p>
                    </button>

                    {/* Carte Candidatures */}
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
                            Mes candidatures
                        </h2>
                        <p className="text-gray-600">
                            Suivez l'état de vos candidatures et gérez vos postulations
                        </p>
                    </button>
                </div>

                {/* Section des offres disponibles */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Offres de stage disponibles
                            </h2>
                            <p className="text-gray-600">
                                Explorez et postulez aux opportunités qui correspondent à votre profil
                            </p>
                        </div>
                    </div>

                    {/* Composant des offres */}
                    <OffresApprouvees />
                </div>
            </div>
        </div>
    );
};

export default DashBoardEtudiant;