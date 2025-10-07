import { Building, Users, ArrowRight } from 'lucide-react'
import {NavLink} from "react-router";
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

const Accueil = () => {
    const { t } = useTranslation(['home']);
    const navigate = useNavigate();
    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== null) {
            switch (sessionStorage.getItem('userType')) {
                case 'EMPLOYEUR':
                    navigate('/dashboard-employeur')
                    break
                case 'ETUDIANT':
                    navigate('/dashboard-etudiant')
                    break
                case 'GESTIONNAIRE':
                    // Par défaut, rediriger vers la page des offres
                    // Mais vous pouvez changer vers CVs si vous préférez
                    navigate('/offres-stages-gestionnaire')
                    break
            }
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
                        {t('home:title')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                        {t('home:subtitle')}
                    </p>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-8">
                            {t('home:chooseRole')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {/* Carte Employeur */}
                            <NavLink
                                to="/inscription-employeur"
                                className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
                            >
                                <div className="flex flex-col items-center">
                                    <Building className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-2xl font-bold mb-2">{t('home:employer')}</h3>
                                    <p className="text-blue-100 mb-4 text-center">
                                        {t('home:employerDescription')}
                                    </p>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </NavLink>

                            {/* Carte Étudiant */}
                            <NavLink
                                to="/inscription-etudiant"
                                className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-8 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
                            >
                                <div className="flex flex-col items-center">
                                    <Users className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-2xl font-bold mb-2">{t('home:student')}</h3>
                                    <p className="text-indigo-100 mb-4 text-center">
                                        {t('home:studentDescription')}
                                    </p>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </NavLink>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-gray-600 mb-4">{t('home:alreadyAccount')}</p>
                        <NavLink
                            to="/login"
                            className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105"
                        >
                            {t('home:login')}
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Accueil