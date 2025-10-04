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
    const { t } = useTranslation(['registration', 'errors']);
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

    // Erreurs de validation (messages déjà traduits)
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Codes d'erreur du backend (se traduisent automatiquement)
    const [backendErrorCodes, setBackendErrorCodes] = useState<string[]>([]);

    const [successMessage, setSuccessMessage] = useState<string>('');

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

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push(t('registration:employerRegistration.validation.passwordMinLength'));
        }

        if (!/[A-Z]/.test(password)) {
            errors.push(t('registration:employerRegistration.validation.passwordUppercase'));
        }

        if (!/[0-9]/.test(password)) {
            errors.push(t('registration:employerRegistration.validation.passwordNumber'));
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push(t('registration:employerRegistration.validation.passwordSpecialChar'));
        }

        return errors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        if (name === 'motDePasse') {
            const passwordValidationErrors = validatePassword(value);
            setPasswordErrors(passwordValidationErrors);
            setIsPasswordValid(passwordValidationErrors.length === 0 && value.length > 0);
        }

        if (validationErrors.length > 0 || backendErrorCodes.length > 0) {
            setValidationErrors([]);
            setBackendErrorCodes([]);
        }
    }

    const validateForm = (): string[] => {
        const errors: string[] = [];

        if (!formData.nomEntreprise.trim()) {
            errors.push(t('registration:employerRegistration.validation.companyNameRequired'));
        }
        if (!formData.adresseEntreprise.trim()) {
            errors.push(t('registration:employerRegistration.validation.companyAddressRequired'));
        }
        if (!formData.prenomContact.trim()) {
            errors.push(t('registration:employerRegistration.validation.contactFirstNameRequired'));
        }
        if (!formData.nomContact.trim()) {
            errors.push(t('registration:employerRegistration.validation.contactLastNameRequired'));
        }
        if (!formData.emailProfessionnel.trim()) {
            errors.push(t('registration:employerRegistration.validation.emailRequired'));
        } else if (!/\S+@\S+\.\S+/.test(formData.emailProfessionnel)) {
            errors.push(t('registration:employerRegistration.validation.emailInvalid'));
        }
        if (!formData.telephone.trim()) {
            errors.push(t('registration:employerRegistration.validation.phoneRequired'));
        }

        if (!formData.motDePasse) {
            errors.push(t('registration:employerRegistration.validation.passwordRequired'));
        } else {
            const passwordValidationErrors = validatePassword(formData.motDePasse);
            errors.push(...passwordValidationErrors);
        }

        if (formData.motDePasse !== formData.confirmerMotDePasse) {
            errors.push(t('registration:employerRegistration.validation.passwordMismatch'));
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors([]);
        setBackendErrorCodes([]);
        setSuccessMessage('');

        const errors = validateForm();
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const apiData = employeurService.formatFormDataForAPI(formData);
            const inscriptionResponse = await employeurService.creerCompte(apiData);

            if (inscriptionResponse) {
                setSuccessMessage(t('registration:employerRegistration.messages.accountCreated'));

                try {
                    const loginData = {
                        email: formData.emailProfessionnel,
                        password: formData.motDePasse
                    };

                    const authResponse = await utilisateurService.authentifier(loginData);

                    if (authResponse && authResponse.token) {
                        setSuccessMessage(t('registration:employerRegistration.messages.accountCreatedAndLoggedIn'));
                        sessionStorage.setItem('fromRegistration', 'true');

                        setTimeout(() => {
                            navigate('/dashboard-employeur');
                        }, 2000);
                    }

                } catch (loginError: any) {
                    console.error('Erreur lors de la connexion automatique:', loginError);

                    // Gestion des erreurs réseau
                    if (loginError.code === 'ERR_NETWORK') {
                        setBackendErrorCodes(['NETWORK_ERROR']);
                    } else {
                        const responseData = loginError.response?.data;

                        // Structure AuthResponseDTO en erreur
                        if (responseData?.errorResponse?.errorCode) {
                            setBackendErrorCodes([responseData.errorResponse.errorCode]);
                        }
                        else if (responseData?.erreur?.errorCode) {
                            setBackendErrorCodes([responseData.erreur.errorCode]);
                        }
                    }

                    setSuccessMessage(t('registration:employerRegistration.messages.accountCreatedPleaseLogin'));
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            }

        } catch (error: any) {
            console.error('Erreur lors de l\'inscription:', error);

            // Gestion des erreurs réseau
            if (error.code === 'ERR_NETWORK') {
                setBackendErrorCodes(['NETWORK_ERROR']);
                return;
            }

            const responseData = error.response?.data;

            if (!responseData) {
                setBackendErrorCodes(['ERROR_000']);
                return;
            }

            // Structure MessageRetourDTO : { message, erreur: { errorCode, message } }
            if (responseData.erreur?.errorCode) {
                setBackendErrorCodes([responseData.erreur.errorCode]);
            }
            // Structure AuthResponseDTO en erreur (au cas où)
            else if (responseData.errorResponse?.errorCode) {
                setBackendErrorCodes([responseData.errorResponse.errorCode]);
            }
            // Ancienne structure directe
            else if (responseData.errorCode) {
                setBackendErrorCodes([responseData.errorCode]);
            } else {
                setBackendErrorCodes(['ERROR_000']);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <NavLink
                        to="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('registration:employerRegistration.backToHome')}
                    </NavLink>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('registration:employerRegistration.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('registration:employerRegistration.subtitle')}
                    </p>
                </div>

                {/* Erreurs de validation côté client */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <ul className="list-disc list-inside space-y-1">
                            {validationErrors.map((error, idx) => (
                                <li key={idx} className="text-red-700 text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Erreurs du backend (se traduisent automatiquement) */}
                {backendErrorCodes.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <ul className="list-disc list-inside space-y-1">
                            {backendErrorCodes.map((errorCode, idx) => (
                                <li key={idx} className="text-red-700 text-sm">
                                    {t(`errors:${errorCode}`, { defaultValue: 'Une erreur est survenue' })}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Message de succès */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800 font-medium text-center">
                        {successMessage}
                        <p className="text-green-600 text-sm mt-1">{t('registration:employerRegistration.redirecting')}</p>
                    </div>
                )}

                {/* Formulaire */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations de l'entreprise */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Building className="w-4 h-4 mr-2 text-blue-600" />
                                {t('registration:employerRegistration.sections.companyInfo')}
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:employerRegistration.fields.companyName')} *
                                </label>
                                <input
                                    type="text"
                                    name="nomEntreprise"
                                    value={formData.nomEntreprise}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:employerRegistration.placeholders.companyName')}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:employerRegistration.fields.companyAddress')} *
                                </label>
                                <input
                                    type="text"
                                    name="adresseEntreprise"
                                    value={formData.adresseEntreprise}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:employerRegistration.placeholders.companyAddress')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Informations du contact */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                                {t('registration:employerRegistration.sections.contactPerson')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('registration:employerRegistration.fields.contactFirstName')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="prenomContact"
                                        value={formData.prenomContact}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder={t('registration:employerRegistration.placeholders.contactFirstName')}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('registration:employerRegistration.fields.contactLastName')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="nomContact"
                                        value={formData.nomContact}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder={t('registration:employerRegistration.placeholders.contactLastName')}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="inline w-4 h-4 mr-1" />
                                    {t('registration:employerRegistration.fields.professionalEmail')} *
                                </label>
                                <input
                                    type="email"
                                    name="emailProfessionnel"
                                    value={formData.emailProfessionnel}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:employerRegistration.placeholders.professionalEmail')}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="inline w-4 h-4 mr-1" />
                                    {t('registration:employerRegistration.fields.phoneNumber')} *
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:employerRegistration.placeholders.phoneNumber')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Sécurité */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                                {t('registration:employerRegistration.sections.accountSecurity')}
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:employerRegistration.fields.password')} *
                                </label>
                                <input
                                    type="password"
                                    name="motDePasse"
                                    value={formData.motDePasse}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                        passwordErrors.length > 0 ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder={t('registration:employerRegistration.placeholders.password')}
                                    disabled={loading}
                                />

                                {passwordErrors.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {passwordErrors.map((error, idx) => (
                                            <p key={idx} className="text-red-600 text-xs">{error}</p>
                                        ))}
                                    </div>
                                )}

                                {isPasswordValid && (
                                    <p className="mt-2 text-green-600 text-xs">✓ {t('registration:employerRegistration.validation.passwordValid')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:employerRegistration.fields.confirmPassword')} *
                                </label>
                                <input
                                    type="password"
                                    name="confirmerMotDePasse"
                                    value={formData.confirmerMotDePasse}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:employerRegistration.placeholders.confirmPassword')}
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
                                    {t('registration:employerRegistration.buttons.creating')}
                                </>
                            ) : (
                                t('registration:employerRegistration.buttons.createAccount')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InscriptionEmployeur;