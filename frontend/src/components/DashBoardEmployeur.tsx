import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router";
import { employeurService } from "../services/EmployeurService";
import { Building, Calendar, MapPin } from 'lucide-react';

const DashBoardEmployeur = () => {
    const navigate = useNavigate();
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
                    .catch(() => console.log("Erreur lors du chargement des offres"));
            }
        }
    }, [navigate]);

    const handleRefuseClick = (reason: string) => {
        setModalReason(reason || "Aucune raison fournie");
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">

                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">
                        Tableau de bord Employeur
                    </h1>
                    <NavLink
                        to="/offre-stage"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105"
                    >
                        Créer une nouvelle offre de stage
                    </NavLink>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        Mes offres de stage
                    </h2>

                    {offres.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg">Aucune offre de stage trouvée</p>
                            <p className="text-gray-400 text-sm mt-2">Commencez par créer votre première offre</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {offres.map((offre, index) => {
                                const isRefused = !!offre.messageRefus;
                                return (
                                    <div
                                        key={index}
                                        className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                                            isRefused 
                                                ? 'border-red-200 bg-red-50 hover:border-red-300 cursor-pointer hover:shadow-lg' 
                                                : 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-lg'
                                        }`}
                                        onClick={() => isRefused && handleRefuseClick(offre.messageRefus)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                    {offre.titre}
                                                </h3>
                                                <p className="text-gray-600 text-sm flex items-center mb-1">
                                                    <Building className="w-4 h-4 mr-2" />
                                                    {offre.employeurDTO?.nomEntreprise}
                                                </p>
                                                {offre.lieuStage && (
                                                    <p className="text-gray-600 text-sm flex items-center">
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        {offre.lieuStage}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                                isRefused 
                                                    ? 'bg-red-200 text-red-800' 
                                                    : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                                {isRefused ? 'Refusée' : 'En attente'}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 mb-4">
                                            {offre.description}
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Début: {offre.date_debut}
                                            </span>
                                            <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Fin: {offre.date_fin}
                                            </span>
                                        </div>

                                        {isRefused && (
                                            <div className="mt-4 text-sm text-red-600 font-medium">
                                                Cliquez pour voir la raison du refus
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
                                    Offre refusée
                                </h3>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6">
                            <p className="text-gray-600 text-sm mb-2">Raison du refus :</p>
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
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashBoardEmployeur;
