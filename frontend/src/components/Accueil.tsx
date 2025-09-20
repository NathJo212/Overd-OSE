import { Building, Users, ArrowRight } from 'lucide-react'
import {NavLink} from "react-router";

const Accueil = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
                        Overd-OSE
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                        Plateforme de gestion des stages et opportunités d'emploi.
                        Connectez les étudiants avec les entreprises pour des expériences professionnelles enrichissantes.
                    </p>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-8">
                            Choisissez votre rôle pour commencer
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {/* Carte Employeur - Disponible */}
                            <NavLink
                                to="/inscription-employeur"
                                className="group bg-white border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                            >
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                                        <Building className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Employeur
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Publiez des offres de stage et recrutez des talents étudiants pour votre entreprise.
                                    </p>
                                    <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                                        <span>S'inscrire</span>
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </NavLink>

                            {/* Carte Étudiant - Indisponible */}
                            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 opacity-60 cursor-not-allowed">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                        <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-500">
                                        Étudiant
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        Trouvez des stages et opportunités d'emploi adaptés à votre profil.
                                    </p>
                                    <div className="flex items-center text-gray-400 font-medium">
                                        <span>Bientôt disponible</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 border-t border-gray-200 pt-6 text-center mt-6">
                        <p>
                            Déjà inscrit ?{' '}
                            <NavLink to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Se connecter
                            </NavLink>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Accueil