import {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import {ArrowLeft, Building, User, Mail, Lock, Phone} from 'lucide-react'
import * as React from "react";
import employeurService from '../services/EmployeurService';
import utilisateurService from '../services/UtilisateurService';
import {NavLink} from "react-router";
import { useTranslation } from 'react-i18next';

interface FormData {
    nomEntreprise: string
    adresseEntreprise: string
    prenomContact: string
    nomContact: string
    emailProfessionnel: string
    telephone: string
    motDePasse: string
    confirmerMotDePasse: string
}

const InscriptionEmployeur = () => {
    const { t } = useTranslation('registration');
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        nomEntreprise: '',
        adresseEntreprise: '',
        prenomContact: '',
        nomContact: '',
        emailProfessionnel: '',
        telephone: '',
        motDePasse: '',
        confirmerMotDePasse: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // États pour la validation du mot de passe
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isPasswordValid, setIsPasswordValid] = useState(false);

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

    // Fonction de validation du mot de passe
    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];

        // Vérifier la longueur minimale (8 caractères)
        if (password.length < 8) {
            errors.push(t('employerRegistration.validation.passwordMinLength'));
        }

        // Vérifier la présence d'au moins une majuscule
        if (!/[A-Z]/.test(password)) {
            errors.push(t('employerRegistration.validation.passwordUppercase'));
        }

        // Vérifier la présence d'au moins un chiffre
        if (!/[0-9]/.test(password)) {
            errors.push(t('employerRegistration.validation.passwordNumber'));
        }

        // Vérifier la présence d'au moins un caractère spécial
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push(t('employerRegistration.validation.passwordSpecialChar'));
        }

        return errors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (!formData.nomEntreprise.trim()) {
            validationErrors.push(t('employerRegistration.validation.companyNameRequired'));
        }
        if (!formData.adresseEntreprise.trim()) {
            validationErrors.push(t('employerRegistration.validation.companyAddressRequired'));
        }
        if (!formData.prenomContact.trim()) {
            validationErrors.push(t('employerRegistration.validation.contactFirstNameRequired'));
        }
        if (!formData.nomContact.trim()) {
            validationErrors.push(t('employerRegistration.validation.contactLastNameRequired'));
        }
        if (!formData.emailProfessionnel.trim()) {
            validationErrors.push(t('employerRegistration.validation.emailRequired'));
        } else if (!/\S+@\S+\.\S+/.test(formData.emailProfessionnel)) {
            validationErrors.push(t('employerRegistration.validation.emailInvalid'));
        }
        if (!formData.telephone.trim()) {
            validationErrors.push(t('employerRegistration.validation.phoneRequired'));
        }

        // Validation améliorée du mot de passe
        if (!formData.motDePasse) {
            validationErrors.push(t('employerRegistration.validation.passwordRequired'));
        } else {
            const passwordValidationErrors = validatePassword(formData.motDePasse);
            validationErrors.push(...passwordValidationErrors);
        }

        if (formData.motDePasse !== formData.confirmerMotDePasse) {
            validationErrors.push(t('employerRegistration.validation.passwordMismatch'));
        }

        return validationErrors;
    };

    // FONCTION HANDLESUBMIT MODIFIÉE AVEC CONNEXION AUTOMATIQUE
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
            // Formater les données pour l'API d'inscription
            const apiData = employeurService.formatFormDataForAPI(formData);

            // 1. Créer le compte employeur
            const inscriptionResponse = await employeurService.creerCompte(apiData);

            if (inscriptionResponse) {
                setSuccessMessage(t('employerRegistration.messages.accountCreated'));

                // 2. Connexion automatique après inscription réussie
                try {
                    const loginData = {
                        email: formData.emailProfessionnel,
                        password: formData.motDePasse
                    };

                    const authResponse = await utilisateurService.authentifier(loginData);

                    if (authResponse) {
                        setSuccessMessage(t('employerRegistration.messages.accountCreatedAndLoggedIn'));

                        // Définir le flag pour indiquer que l'utilisateur vient d'une inscription
                        sessionStorage.setItem('fromRegistration', 'true');

                        // Redirection vers le dashboard employeur
                        setTimeout(() => {
                            navigate('/dashboard-employeur');
                        }, 2000);
                    } else {
                        // Si la connexion automatique échoue, rediriger vers login
                        setSuccessMessage(t('employerRegistration.messages.accountCreatedPleaseLogin'));
                        setTimeout(() => {
                            navigate('/login');
                        }, 2000);
                    }

                } catch (loginError) {
                    console.error('Erreur lors de la connexion automatique:', loginError);
                    setSuccessMessage(t('employerRegistration.messages.accountCreatedPleaseLogin'));
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            }

        } catch (error) {
            if (error instanceof Error) {
                setErrors([error.message]);
            } else {
                setErrors([t('employerRegistration.messages.unknownError')]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <NavLink
                        to="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('employerRegistration.backToHome')}
                    </NavLink>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('employerRegistration.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('employerRegistration.subtitle')}
                    </p>
                </div>

                {/* Messages d'erreur et de succès */}
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
                        <p className="text-green-600 text-sm mt-1">{t('employerRegistration.redirecting')}</p>
                    </div>
                )}

                {/* Formulaire d'inscription */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations de l'entreprise */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Building className="w-4 h-4 mr-2 text-blue-600" />
                                {t('employerRegistration.sections.companyInfo')}
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('employerRegistration.fields.companyName')} *
                                </label>
                                <input
                                    type="text"
                                    name="nomEntreprise"
                                    value={formData.nomEntreprise}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('employerRegistration.placeholders.companyName')}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('employerRegistration.fields.companyAddress')} *
                                </label>
                                <input
                                    type="text"
                                    name="adresseEntreprise"
                                    value={formData.adresseEntreprise}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('employerRegistration.placeholders.companyAddress')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Informations du contact */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                                {t('employerRegistration.sections.contactPerson')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('employerRegistration.fields.contactFirstName')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="prenomContact"
                                        value={formData.prenomContact}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder={t('employerRegistration.placeholders.contactFirstName')}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('employerRegistration.fields.contactLastName')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="nomContact"
                                        value={formData.nomContact}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder={t('employerRegistration.placeholders.contactLastName')}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="inline w-4 h-4 mr-1" />
                                    {t('employerRegistration.fields.professionalEmail')} *
                                </label>
                                <input
                                    type="email"
                                    name="emailProfessionnel"
                                    value={formData.emailProfessionnel}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('employerRegistration.placeholders.professionalEmail')}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="inline w-4 h-4 mr-1" />
                                    {t('employerRegistration.fields.phoneNumber')} *
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('employerRegistration.placeholders.phoneNumber')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Sécurité */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                                {t('employerRegistration.sections.accountSecurity')}
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('employerRegistration.fields.password')} *
                                </label>
                                <input
                                    type="password"
                                    name="motDePasse"
                                    value={formData.motDePasse}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                        passwordErrors.length > 0 ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder={t('employerRegistration.placeholders.password')}
                                    disabled={loading}
                                />

                                {/* Affichage des erreurs de validation du mot de passe */}
                                {passwordErrors.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {passwordErrors.map((error, idx) => (
                                            <p key={idx} className="text-red-600 text-xs">{error}</p>
                                        ))}
                                    </div>
                                )}

                                {/* Indicateur de mot de passe valide */}
                                {isPasswordValid && (
                                    <p className="mt-2 text-green-600 text-xs">✓ {t('employerRegistration.validation.passwordValid')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('employerRegistration.fields.confirmPassword')} *
                                </label>
                                <input
                                    type="password"
                                    name="confirmerMotDePasse"
                                    value={formData.confirmerMotDePasse}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('employerRegistration.placeholders.confirmPassword')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Bouton de soumission */}
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
                                    {t('employerRegistration.buttons.creating')}
                                </>
                            ) : (
                                t('employerRegistration.buttons.createAccount')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InscriptionEmployeur;