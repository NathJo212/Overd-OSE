import {useEffect, useState} from 'react'
import { useNavigate, NavLink } from 'react-router'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import utilisateurService from '../services/UtilisateurService'
import * as React from "react";
import { useTranslation } from 'react-i18next';

interface FormData {
    email: string
    password: string
}

const Login = () => {
    const { t } = useTranslation(['login', 'errors']);
    const navigate = useNavigate()
    const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
    const [loading, setLoading] = useState(false)

    // Erreurs de validation côté client (déjà traduites)
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    // Codes d'erreur du backend (se traduisent automatiquement)
    const [backendErrorCodes, setBackendErrorCodes] = useState<string[]>([])

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
                case 'PROFESSEUR':
                    navigate('/dashboard-professeur')
            }
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (validationErrors.length > 0 || backendErrorCodes.length > 0) {
            setValidationErrors([])
            setBackendErrorCodes([])
        }
    }

    const validateForm = (): string[] => {
        const errors: string[] = []
        if (!formData.email.trim()) {
            errors.push(t('login:validation.emailRequired'))
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.push(t('login:validation.emailInvalid'))
        }
        if (!formData.password) {
            errors.push(t('login:validation.passwordRequired'))
        }
        return errors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setValidationErrors([])
        setBackendErrorCodes([])

        const errors = validateForm()
        if (errors.length > 0) {
            setValidationErrors(errors)
            return
        }

        setLoading(true)

        try {
            const loginData = utilisateurService.formatLoginDataForAPI(formData)
            const authResponse = await utilisateurService.authentifier(loginData)

            if (authResponse) {
                sessionStorage.setItem('fromLogin', 'true');

                setTimeout(() => {
                    const userType = sessionStorage.getItem('userType');
                    switch (userType) {
                        case 'EMPLOYEUR':
                            navigate('/dashboard-employeur')
                            break
                        case 'ETUDIANT':
                            navigate('/dashboard-etudiant')
                            break
                        case 'GESTIONNAIRE':
                            navigate('/dashboard-gestionnaire')
                            break
                        case 'PROFESSEUR':
                            navigate('/dashboard-professeur')
                            break
                        default:
                            navigate('/')
                            break
                    }
                })
            }

        } catch (error: any) {
            console.error('Erreur lors de la connexion:', error);

            // Gestion des erreurs réseau
            if (error.code === 'ERR_NETWORK') {
                setBackendErrorCodes(['NETWORK_ERROR']);
                return;
            }

            const responseData = error.response?.data;

            if (responseData?.errorResponse?.errorCode) {
                setBackendErrorCodes([responseData.errorResponse.errorCode]);
            }

            // Erreur inconnue
            else {
                setBackendErrorCodes(['ERROR_000']);
            }
        } finally {
            setLoading(false)
        }
    }

    const handleTestLogin = async (userType: 'EMPLOYEUR' | 'ETUDIANT' | 'GESTIONNAIRE' | 'PROFESSEUR') => {
        setLoading(true)
        setValidationErrors([])
        setBackendErrorCodes([])

        let testCredentials: FormData
        if (userType === 'EMPLOYEUR') {
            testCredentials = { email: 'mon@employeur.com', password: 'Employeur123%' }
        } else if (userType === 'ETUDIANT') {
            testCredentials = { email: 'etudiant@example.com', password: 'Etudiant128&' }
        } else if (userType === 'GESTIONNAIRE') {
            testCredentials = { email: 'gestionnaire@example.com', password: 'Gestion128&' }
        } else {
            testCredentials = { email: 'professeur@example.com', password: 'Prof128&' }
        }

        try {
            const loginData = utilisateurService.formatLoginDataForAPI(testCredentials)
            const authResponse = await utilisateurService.authentifier(loginData)

            if (authResponse) {
                sessionStorage.setItem('fromLogin', 'true');

                setTimeout(() => {
                    navigate(userType === 'EMPLOYEUR' ? '/dashboard-employeur' :
                            userType === 'ETUDIANT' ? '/dashboard-etudiant' :
                            userType === 'GESTIONNAIRE' ? '/dashboard-gestionnaire' :
                            '/dashboard-professeur')
                })
            }

        } catch (error: any) {
            console.error('Erreur lors de la connexion test:', error);
            if (error.code === 'ERR_NETWORK') {
                setBackendErrorCodes(['NETWORK_ERROR']);
            } else {
                setBackendErrorCodes(['ERROR_000']);
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Titre de l'application */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                        <span className="text-white font-bold text-2xl">O</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('login:title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('login:subtitle')}
                    </p>
                </div>

                {/* Carte de formulaire */}
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-8 border border-slate-200">
                    {/* Messages d'erreur de validation */}
                    {validationErrors.length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                                        {t('login:errorTitle')}
                                    </h3>
                                    <ul className="space-y-1">
                                        {validationErrors.map((error, idx) => (
                                            <li key={idx} className="text-sm text-red-700">• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Messages d'erreur du backend */}
                    {backendErrorCodes.length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                                        {t('login:errorTitle')}
                                    </h3>
                                    <ul className="space-y-1">
                                        {backendErrorCodes.map((errorCode, idx) => (
                                            <li key={idx} className="text-sm text-red-700">
                                                • {t(`errors:${errorCode}`, { defaultValue: t('errors:ERROR_000') })}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                {t('login:fields.email')}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder={t('login:placeholders.email')}
                                disabled={loading}
                            />
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Lock className="w-4 h-4 text-blue-600" />
                                {t('login:fields.password')}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder={t('login:placeholders.password')}
                                disabled={loading}
                            />
                        </div>

                        {/* Bouton de connexion */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-400 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {t('login:buttons.connecting')}
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {t('login:buttons.login')}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick-login buttons (dev only) */}
                    <div className="mt-6">
                        <p className="text-sm text-slate-600 mb-2">Comptes de test — développement seulement :</p>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleTestLogin('EMPLOYEUR')}
                                className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-xl transition-colors disabled:bg-slate-300"
                            >
                                Se connecter en tant qu'Employeur
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleTestLogin('ETUDIANT')}
                                className="cursor-pointer flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-xl transition-colors disabled:bg-slate-300"
                            >
                                Se connecter en tant qu'Étudiant
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleTestLogin('GESTIONNAIRE')}
                                className="cursor-pointer flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-xl transition-colors disabled:bg-slate-300"
                            >
                                Se connecter en tant que Gestionnaire
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleTestLogin('PROFESSEUR')}
                                className="cursor-pointer flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 rounded-xl transition-colors disabled:bg-slate-300"
                            >
                                Se connecter en tant que Professeur
                            </button>
                        </div>
                        <p className="text-xs text-rose-600 mt-2">Pour tests seulement — ne pas utiliser en production.</p>
                    </div>


                    {/* Lien d'inscription */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                            {t('login:noAccount')}{' '}
                            <NavLink
                                to="/"
                                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                {t('login:signUp')}
                            </NavLink>
                        </p>
                    </div>
                </div>

                {/* Note de sécurité */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    {t('login:securityNote')}
                </p>
            </div>
        </div>
    )
}

export default Login