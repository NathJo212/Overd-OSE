import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Lock, GraduationCap, Calendar } from 'lucide-react'
import * as React from "react";
import etudiantService from '../services/EtudiantService';

interface FormData {
    prenom: string
    nom: string
    email: string
    telephone: string
    motDePasse: string
    confirmerMotDePasse: string
    programmeEtudes: string
    anneeSession: string
}

const InscriptionEtudiant = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        motDePasse: '',
        confirmerMotDePasse: '',
        programmeEtudes: '',
        anneeSession: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // États pour la validation du mot de passe
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    // Fonction de validation du mot de passe
    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];

        // Vérifier la longueur minimale (8 caractères)
        if (password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        }

        // Vérifier la présence d'au moins une majuscule
        if (!/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }

        // Vérifier la présence d'au moins un chiffre
        if (!/[0-9]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }

        // Vérifier la présence d'au moins un caractère spécial
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)');
        }

        return errors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Validation spéciale pour le mot de passe
        if (name === 'motDePasse') {
            const passwordValidationErrors = validatePassword(value);
            setPasswordErrors(passwordValidationErrors);
            setIsPasswordValid(passwordValidationErrors.length === 0 && value.length > 0);
        }

        // Effacer les erreurs générales quand l'utilisateur tape
        if (errors.length > 0) {
            setErrors([]);
        }
    }

    const validateForm = (): string[] => {
        const validationErrors: string[] = [];

        if (!formData.prenom.trim()) {
            validationErrors.push('Le prénom est requis');
        }
        if (!formData.nom.trim()) {
            validationErrors.push('Le nom est requis');
        }
        if (!formData.email.trim()) {
            validationErrors.push('L\'adresse courriel est requise');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            validationErrors.push('L\'adresse courriel n\'est pas valide');
        }
        if (!formData.telephone.trim()) {
            validationErrors.push('Le numéro de téléphone est requis');
        }
        if (!formData.programmeEtudes.trim()) {
            validationErrors.push('Le programme d\'études est requis');
        }
        if (!formData.anneeSession) {
            validationErrors.push('L\'année/session d\'étude est requise');
        }

        // Validation améliorée du mot de passe
        if (!formData.motDePasse) {
            validationErrors.push('Le mot de passe est requis');
        } else {
            const passwordValidationErrors = validatePassword(formData.motDePasse);
            validationErrors.push(...passwordValidationErrors);
        }

        if (formData.motDePasse !== formData.confirmerMotDePasse) {
            validationErrors.push('Les mots de passe ne correspondent pas');
        }

        return validationErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setSuccessMessage('');

        // Validation côté client
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            // Formater les données pour l'API
            const apiData = etudiantService.formatFormDataForAPI(formData);

            // Appel à l'API
            const response = await etudiantService.creerCompte(apiData);

            setSuccessMessage(response.message);

            // Redirection après succès (optionnel)
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            if (error instanceof Error) {
                setErrors([error.message]);
            } else {
                setErrors(['Une erreur inconnue est survenue']);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Inscription Étudiant
                    </h1>
                    <p className="text-gray-600">
                        Créez votre compte étudiant pour accéder aux offres de stage.
                    </p>
                </div>

                {/* Messages d'erreur */}
                {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h3 className="text-red-800 font-medium mb-2">Erreurs de validation :</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {errors.map((error, index) => (
                                <li key={index} className="text-red-700 text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Message de succès */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-green-800 font-medium">{successMessage}</p>
                        <p className="text-green-600 text-sm mt-1">Redirection en cours...</p>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="space-y-6">

                        {/* Informations personnelles */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                                Informations personnelles
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prénom *
                                    </label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="Jean"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom *
                                    </label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="Dupont"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="inline w-4 h-4 mr-1" />
                                    Adresse courriel *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="jean.dupont@example.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Numéro de téléphone *
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="123 123 1234"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Informations académiques */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                                Informations académiques
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Programme d'études *
                                </label>
                                <input
                                    type="text"
                                    name="programmeEtudes"
                                    value={formData.programmeEtudes}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Ex: Techniques de l'informatique"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="inline w-4 h-4 mr-1" />
                                    Année/Session d'étude *
                                </label>
                                <select
                                    name="anneeSession"
                                    value={formData.anneeSession}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    disabled={loading}
                                >
                                    <option value="">Sélectionnez votre année/session</option>
                                    <option value="1ere-annee">1ère année</option>
                                    <option value="2eme-annee">2ème année</option>
                                    <option value="3eme-annee">3ème année</option>
                                    <option value="session-automne">Session Automne</option>
                                    <option value="session-hiver">Session Hiver</option>
                                </select>
                            </div>
                        </div>

                        {/* Sécurité */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                                Sécurité
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mot de passe *
                                </label>
                                <input
                                    type="password"
                                    name="motDePasse"
                                    value={formData.motDePasse}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                        formData.motDePasse.length > 0
                                            ? isPasswordValid
                                                ? 'border-green-500 focus:ring-green-500'
                                                : 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Minimum 8 caractères"
                                    disabled={loading}
                                />

                                {/* Indicateur de force du mot de passe */}
                                {formData.motDePasse.length > 0 && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">Force:</span>
                                        <span className={`text-sm font-medium ${
                                            isPasswordValid
                                                ? 'text-green-600'
                                                : passwordErrors.length <= 2
                                                    ? 'text-yellow-600'
                                                    : 'text-red-600'
                                        }`}>
                                            {isPasswordValid
                                                ? 'Fort'
                                                : passwordErrors.length <= 2
                                                    ? 'Moyen'
                                                    : 'Faible'
                                            }
                                        </span>
                                    </div>
                                )}

                                {/* Critères de validation */}
                                {formData.motDePasse.length > 0 && (
                                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Critères requis :</h4>
                                        <ul className="space-y-1 text-sm">
                                            <li className={`flex items-center ${
                                                formData.motDePasse.length >= 8 ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                                <span className="mr-2">{formData.motDePasse.length >= 8 ? '✓' : '○'}</span>
                                                Au moins 8 caractères
                                            </li>
                                            <li className={`flex items-center ${
                                                /[A-Z]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                                <span className="mr-2">{/[A-Z]/.test(formData.motDePasse) ? '✓' : '○'}</span>
                                                Une majuscule
                                            </li>
                                            <li className={`flex items-center ${
                                                /[0-9]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                                <span className="mr-2">{/[0-9]/.test(formData.motDePasse) ? '✓' : '○'}</span>
                                                Un chiffre
                                            </li>
                                            <li className={`flex items-center ${
                                                /[!@#$%^&*(),.?":{}|<>]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                                <span className="mr-2">{/[!@#$%^&*(),.?":{}|<>]/.test(formData.motDePasse) ? '✓' : '○'}</span>
                                                Un caractère spécial
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmer le mot de passe *
                                </label>
                                <input
                                    type="password"
                                    name="confirmerMotDePasse"
                                    value={formData.confirmerMotDePasse}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                        formData.confirmerMotDePasse.length > 0
                                            ? formData.motDePasse === formData.confirmerMotDePasse
                                                ? 'border-green-500 focus:ring-green-500'
                                                : 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Confirmez votre mot de passe"
                                    disabled={loading}
                                />

                                {/* Indicateur de correspondance */}
                                {formData.confirmerMotDePasse.length > 0 && (
                                    <div className="mt-2">
                                        {formData.motDePasse === formData.confirmerMotDePasse ? (
                                            <p className="text-sm text-green-600 flex items-center">
                                                <span className="mr-1">✓</span>
                                                Les mots de passe correspondent
                                            </p>
                                        ) : (
                                            <p className="text-sm text-red-600 flex items-center">
                                                <span className="mr-1">✗</span>
                                                Les mots de passe ne correspondent pas
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Création en cours...
                                    </>
                                ) : (
                                    'Créer mon compte étudiant'
                                )}
                            </button>

                            <p className="mt-4 text-center text-sm text-gray-600">
                                Vous avez déjà un compte ?{' '}
                                <Link to="/connexion" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InscriptionEtudiant