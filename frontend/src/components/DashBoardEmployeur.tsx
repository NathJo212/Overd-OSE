import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router";
import { employeurService } from "../services/EmployeurService";
import { Building, Calendar, MapPin, CheckCircle, X, GraduationCap } from 'lucide-react';
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

const DashBoardEmployeur = () => {
    const { t } = useTranslation(["employerdashboard"]);
    const { t: tProgrammes } = useTranslation('programmes');
    const navigate = useNavigate();
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [offres, setOffres] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalReason, setModalReason] = useState("");

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
        } else {
            const token = sessionStorage.getItem("authToken");
            if (token) {
                employeurService.getOffresParEmployeur(token)
                    .then(offres => setOffres(offres))
                    .catch(() => setNotificationMessage(t("employerdashboard:errors.loadOffers")));
            }
            return;
        }

        // Vérifier si l'utilisateur vient d'une inscription ou connexion réussie
        const fromRegistration = sessionStorage.getItem('fromRegistration');
        const fromLogin = sessionStorage.getItem('fromLogin');

        if (fromRegistration === 'true') {
            setNotificationMessage(t('employerdashboard:notifications.welcomeCreated'));
            setShowNotification(true);
            // Nettoyer le flag pour éviter de re-montrer la notification
            sessionStorage.removeItem('fromRegistration');
        } else if (fromLogin === 'true') {
            setNotificationMessage(t('employerdashboard:notifications.welcomeLogin'));
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
    }, [navigate, showNotification, t]);

    const handleCloseNotification = () => {
        setShowNotification(false);
    };

    const handleRefuseClick = (reason: string) => {
        setModalReason(reason || "Aucune raison fournie");
        setShowModal(true);
    };

    return (
        <div className="bg-gray-200">
            <NavBar/>
            <div className="min-h-screen bg-gradient-to-br p-4">
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
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">
                            {t("employerdashboard:title")}
                        </h1>
                        <NavLink
                            to="/offre-stage"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105"
                        >
                            {t("employerdashboard:createOffer")}
                        </NavLink>

                        <NavLink to="/candidatures-recues" className="inline-block ml-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105">
                            {t("employerdashboard:myApplications")}
                        </NavLink>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                            {t("employerdashboard:myOffers")}
                        </h2>

                        {offres.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-lg">{t("employerdashboard:noOffers.title")}</p>
                                <p className="text-gray-400 text-sm mt-2">{t("employerdashboard:noOffers.subtitle")}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {offres.map((offre, index) => {
                                    const statutApprouve = offre.statutApprouve || 'ATTENTE';
                                    const isRefused = statutApprouve === 'REFUSE';
                                    const isApproved = statutApprouve === 'APPROUVE';

                                    return (
                                        <div
                                            key={index}
                                            className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                                                isRefused
                                                    ? 'border-red-200 bg-red-50 hover:border-red-300 cursor-pointer hover:shadow-lg'
                                                    : isApproved
                                                        ? 'border-green-200 bg-green-50 hover:border-green-300 hover:shadow-lg'
                                                        : 'border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:shadow-lg'
                                            }`}
                                            onClick={() => isRefused && handleRefuseClick(offre.messageRefus)}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                        {offre.titre}
                                                    </h3>
                                                    <p className="text-gray-600 text-sm flex items-center mb-1">
                                                        <Building className="w-4 h-4 mr-2" />
                                                        {offre.employeurDTO?.nomEntreprise}
                                                    </p>
                                                    {offre.lieuStage && (
                                                        <p className="text-gray-600 text-sm flex items-center mb-1">
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            {offre.lieuStage}
                                                        </p>
                                                    )}
                                                    {offre.progEtude && (
                                                        <p className="text-gray-600 text-sm flex items-center">
                                                            <GraduationCap className="w-4 h-4 mr-2" />
                                                            {tProgrammes(offre.progEtude)}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 ml-4 ${
                                                    isRefused
                                                        ? 'bg-red-200 text-red-800'
                                                        : isApproved
                                                            ? 'bg-green-200 text-green-800'
                                                            : 'bg-yellow-200 text-yellow-800'
                                                }`}>
                                                {isRefused ? t("employerdashboard:status.refused") : isApproved ? t("employerdashboard:status.approved") : t("employerdashboard:status.pending")}
                                            </span>
                                            </div>

                                            <p className="text-gray-700 mb-4">
                                                {offre.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {t("employerdashboard:start")}: {offre.date_debut}
                                            </span>
                                                <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {t("employerdashboard:end")}: {offre.date_fin}
                                            </span>
                                            </div>

                                            {isRefused && (
                                                <div className="mt-4 text-sm text-red-600 font-medium">
                                                    {t("employerdashboard:clickToSeeRefuseReason")}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
                            {/* Modal Header */}
                            <div className="bg-red-50 px-6 py-4 rounded-t-xl border-b border-red-100">
                                <div className="flex items-center justify-center">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-red-700">
                                        {t("employerdashboard:modal.refusedTitle")}
                                    </h3>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-6">
                                <p className="text-gray-600 text-sm mb-2">{t("employerdashboard:modal.refusedReason")}</p>
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="text-gray-800 leading-relaxed">
                                        {modalReason}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                    onClick={() => setShowModal(false)}
                                >
                                    {t("employerdashboard:modal.close")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashBoardEmployeur;