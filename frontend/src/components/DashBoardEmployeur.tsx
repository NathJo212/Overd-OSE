import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router";
import { CheckCircle, X } from "lucide-react";

const DashBoardEmployeur = () => {
    const navigate = useNavigate();
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
            return;
        }

        // Vérifier si l'utilisateur vient d'une inscription ou connexion réussie
        const fromRegistration = sessionStorage.getItem('fromRegistration');
        const fromLogin = sessionStorage.getItem('fromLogin');

        if (fromRegistration === 'true') {
            setNotificationMessage('Bienvenue ! Votre compte a été créé et vous êtes connecté avec succès.');
            setShowNotification(true);
            // Nettoyer le flag pour éviter de re-montrer la notification
            sessionStorage.removeItem('fromRegistration');
        } else if (fromLogin === 'true') {
            setNotificationMessage('Connexion réussie ! Bienvenue sur votre tableau de bord.');
            setShowNotification(true);
            // Nettoyer le flag pour éviter de re-montrer la notification
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification de succès */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50 max-w-md w-full">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
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
                                    className="bg-green-50 rounded-md inline-flex text-green-400 hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <span className="sr-only">Fermer</span>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu principal du dashboard */}
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-6">Tableau de bord Employeur</h1>
                    <NavLink
                        to="/offre-stage"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
                    >
                        Créer une offre de stage
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default DashBoardEmployeur;