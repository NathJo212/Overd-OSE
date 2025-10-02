import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, X } from "lucide-react";
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
        <>
            <NavBar/>
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
                <div className="container mx-auto px-4 py-8">
                    {/* En-tête du dashboard */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Tableau de bord Étudiant
                        </h1>
                        <p className="text-gray-600">
                            Explorez les offres de stage disponibles et postulez dès maintenant
                        </p>
                    </div>

                    {/* Composant des offres */}
                    <OffresApprouvees />
                </div>
            </div>
        </>
    );
};

export default DashBoardEtudiant;