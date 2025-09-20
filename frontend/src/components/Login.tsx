import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {NavLink} from "react-router";

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
            // Remplace par ton appel API
            await new Promise(res => setTimeout(res, 1000))
            setSuccessMessage('Connexion réussie !')
            setTimeout(() => navigate('/'), 1500)
        } catch {
            setErrors(['Identifiants invalides'])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Connexion</h1>
                <p className="text-gray-600 mb-8 text-center">Connectez-vous à votre compte employeur</p>

                {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <ul className="list-disc list-inside space-y-1">
                            {errors.map((error, idx) => (
                                <li key={idx} className="text-red-700 text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800 font-medium text-center">
                        {successMessage}
                        <p className="text-green-600 text-sm mt-1">Redirection...</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse courriel</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="exemple@domaine.com"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Votre mot de passe"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connexion...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="text-sm text-gray-500 border-t border-gray-200 pt-6 text-center mt-6">
                    <p>
                        Pas encore de compte ?{' '}
                        <NavLink to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                            S'inscrire
                        </NavLink>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login