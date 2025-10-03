import {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { NavLink } from "react-router"
import { LogIn, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import utilisateurService from '../services/UtilisateurService'
import * as React from "react";

interface FormData {
    email: string
    password: string
}

const Login = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [successMessage, setSuccessMessage] = useState<string>('')

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
                    navigate('/offres-stages-gestionnaire')
                    break
            }
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors.length > 0) setErrors([])
    }

    const validateForm = (): string[] => {
        const validationErrors: string[] = []
        if (!formData.email.trim()) validationErrors.push('Adresse courriel requise')
        else if (!/\S+@\S+\.\S+/.test(formData.email)) validationErrors.push('Adresse courriel invalide')
        if (!formData.password) validationErrors.push('Mot de passe requis')
        return validationErrors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors([])
        setSuccessMessage('')

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            return
        }

        setLoading(true)

        try {
            const loginData = utilisateurService.formatLoginDataForAPI(formData)
            const authResponse = await utilisateurService.authentifier(loginData)

            if (authResponse) {
                setSuccessMessage('Connexion réussie !')
                sessionStorage.setItem('fromLogin', 'true');

                setTimeout(() => {
                    switch (sessionStorage.getItem('userType')) {
                        case 'EMPLOYEUR':
                            navigate('/dashboard-employeur')
                            break
                        case 'ETUDIANT':
                            navigate('/dashboard-etudiant')
                            break
                        case 'GESTIONNAIRE':
                            navigate('/offres-stages-gestionnaire')
                            break
                        default:
                            navigate('/')
                            break
                    }
                }, 1500)
            }

        } catch (error) {
            if (error instanceof Error) {
                setErrors([error.message])
            } else {
                setErrors(['Une erreur inattendue s\'est produite'])
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Titre de l'application */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                        <span className="text-white font-bold text-2xl">O</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
                    <p className="text-gray-600">Accédez à votre espace Overd-OSE</p>
                </div>

                {/* Carte de formulaire */}
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-400 transition-all duration-300 p-8 border border-slate-200">
                    {/* Messages d'erreur */}
                    {errors.length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-900 mb-1">Erreur de connexion</h3>
                                    <ul className="space-y-1">
                                        {errors.map((error, idx) => (
                                            <li key={idx} className="text-sm text-red-700">• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message de succès */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900">{successMessage}</p>
                                    <p className="text-xs text-green-700 mt-1">Redirection en cours...</p>
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
                                Adresse courriel
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="exemple@domaine.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Lock className="w-4 h-4 text-blue-600" />
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Votre mot de passe"
                                disabled={loading}
                            />
                        </div>

                        {/* Bouton de connexion */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-400 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    {/* Lien d'inscription */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                            Pas encore de compte ?{' '}
                            <NavLink
                                to="/"
                                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                S'inscrire
                            </NavLink>
                        </p>
                    </div>
                </div>

                {/* Note de sécurité */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    Vos informations sont protégées et sécurisées
                </p>
            </div>
        </div>
    )
}

export default Login