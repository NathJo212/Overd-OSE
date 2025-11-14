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
                    navigate('/dashboard-gestionnaire')
                    break
            }
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-12 border border-transparent dark:border-slate-700">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-slate-100 mb-6">
                        {t('home:title')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
                        {t('home:subtitle')}
                    </p>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-8">
                            {t('home:chooseRole')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {/* Carte Employeur */}
                            <NavLink
                                to="/inscription-employeur"
                                className="group bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-500 rounded-xl p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                            >
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 rounded-full flex items-center justify-center transition-colors">
                                        <Building className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
                                        {t('home:employer.title')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-slate-300 text-sm">
                                        {t('home:employer.description')}
                                    </p>
                                    <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                        <span>{t('home:employer.register')}</span>
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </NavLink>

                            {/* Carte Étudiant */}
                            <NavLink
                                to="/inscription-etudiant"
                                className="group bg-white dark:bg-slate-800 border-2 border-green-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-slate-500 rounded-xl p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                            >
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 rounded-full flex items-center justify-center transition-colors">
                                        <Users className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
                                        {t('home:student.title')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-slate-300 text-sm">
                                        {t('home:student.description')}
                                    </p>
                                    <div className="flex items-center text-green-600 dark:text-green-400 font-medium group-hover:text-green-700 dark:group-hover:text-green-300">
                                        <span>{t('home:student.register')}</span>
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </NavLink>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700 pt-6 text-center mt-6">
                        <p>
                            {t('home:alreadyRegistered')}{' '}
                            <NavLink to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                                {t('home:login')}
                            </NavLink>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Accueil
