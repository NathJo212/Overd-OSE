import {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import {ArrowLeft, User, Mail, Lock, GraduationCap, Phone} from 'lucide-react'
import * as React from "react";
import etudiantService from '../services/EtudiantService';
import utilisateurService from '../services/UtilisateurService';
import {NavLink} from "react-router";
import { useTranslation } from 'react-i18next';

interface FormData {
    prenom: string
    nom: string
    email: string
    telephone: string
    motDePasse: string
    confirmerMotDePasse: string
    programmeEtudes: string
    anneeEtude: string
    session: string
}

const InscriptionEtudiant = () => {
    const { t } = useTranslation(['registration', 'errors']);
    const { t: tProgrammes } = useTranslation('programmes');
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        motDePasse: '',
        confirmerMotDePasse: '',
        programmeEtudes: '',
        anneeEtude: '',
        session: ''
    });

    const [loading, setLoading] = useState(false);

    // Erreurs de validation (messages déjà traduits)
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Codes d'erreur du backend (se traduisent automatiquement)
    const [backendErrorCodes, setBackendErrorCodes] = useState<string[]>([]);

    const [successMessage, setSuccessMessage] = useState<string>('');
    const [programmes, setProgrammes] = useState<string[]>([]);
    const [loadingProgrammes, setLoadingProgrammes] = useState(true);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    useEffect(() => {
        const loadProgrammes = async () => {
            try {
                setLoadingProgrammes(true);
                const programmesData = await utilisateurService.getAllProgrammes();
                setProgrammes(programmesData);
            } catch (error) {
                setBackendErrorCodes(['ERROR_000']);
            } finally {
                setLoadingProgrammes(false);
            }
        };
        loadProgrammes().then();
    }, []);

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

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push(t('registration:studentRegistration.validation.passwordMinLength'));
        }
        if (!/[A-Z]/.test(password)) {
            errors.push(t('registration:studentRegistration.validation.passwordUppercase'));
        }
        if (!/[0-9]/.test(password)) {
            errors.push(t('registration:studentRegistration.validation.passwordNumber'));
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push(t('registration:studentRegistration.validation.passwordSpecialChar'));
        }
        return errors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        const validationErrs: string[] = [];
        if (!formData.prenom.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.firstNameRequired'));
        }
        if (!formData.nom.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.lastNameRequired'));
        }
        if (!formData.email.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.emailRequired'));
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            validationErrs.push(t('registration:studentRegistration.validation.emailInvalid'));
        }
        if (!formData.telephone.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.phoneRequired'));
        }
        if (!formData.programmeEtudes.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.studyProgramRequired'));
        }
        if (!formData.anneeEtude.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.studyYearRequired'));
        }
        if (!formData.session.trim()) {
            validationErrs.push(t('registration:studentRegistration.validation.sessionRequired'));
        }
        if (!formData.motDePasse) {
            validationErrs.push(t('registration:studentRegistration.validation.passwordRequired'));
        } else {
            const passwordValidationErrors = validatePassword(formData.motDePasse);
            validationErrs.push(...passwordValidationErrors);
        }
        if (formData.motDePasse !== formData.confirmerMotDePasse) {
            validationErrs.push(t('registration:studentRegistration.validation.passwordMismatch'));
        }
        return validationErrs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors([]);
        setBackendErrorCodes([]);
        setSuccessMessage('');

        const validationErrs = validateForm();
        if (validationErrs.length > 0) {
            setValidationErrors(validationErrs);
            return;
        }

        setLoading(true);

        try {
            const apiData = etudiantService.formatFormDataForAPI(formData);
            const inscriptionResponse = await etudiantService.creerCompte(apiData);

            if (inscriptionResponse) {
                setSuccessMessage(t('registration:studentRegistration.messages.accountCreated'));

                try {
                    const loginData = {
                        email: formData.email,
                        password: formData.motDePasse
                    };

                    const authResponse = await utilisateurService.authentifier(loginData);

                    if (authResponse && authResponse.token) {
                        setSuccessMessage(t('registration:studentRegistration.messages.accountCreatedAndLoggedIn'));
                        sessionStorage.setItem('fromRegistration', 'true');
                        setTimeout(() => {
                            navigate('/dashboard-etudiant');
                        }, 2000);
                    }

                } catch (loginError: any) {
                    console.error('Erreur lors de la connexion automatique:', loginError);

                    setSuccessMessage(t('registration:studentRegistration.messages.accountCreatedPleaseLogin'));
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

            if (responseData.erreur?.errorCode) {
                setBackendErrorCodes([responseData.erreur.errorCode]);
            }
            else if (responseData.errorResponse?.errorCode) {
                setBackendErrorCodes([responseData.errorResponse.errorCode]);
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <NavLink
                        to="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('registration:studentRegistration.backToHome')}
                    </NavLink>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('registration:studentRegistration.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('registration:studentRegistration.subtitle')}
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

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800 font-medium text-center">
                        {successMessage}
                        <p className="text-green-600 text-sm mt-1">{t('registration:studentRegistration.redirecting')}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                                {t('registration:studentRegistration.sections.personalInfo')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('registration:studentRegistration.fields.firstName')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder={t('registration:studentRegistration.placeholders.firstName')}
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('registration:studentRegistration.fields.lastName')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder={t('registration:studentRegistration.placeholders.lastName')}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="inline w-4 h-4 mr-1" />
                                    {t('registration:studentRegistration.fields.email')} *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:studentRegistration.placeholders.email')}
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="inline w-4 h-4 mr-1" />
                                    {t('registration:studentRegistration.fields.phoneNumber')} *
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:studentRegistration.placeholders.phoneNumber')}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                                {t('registration:studentRegistration.sections.academicInfo')}
                            </h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:studentRegistration.fields.studyProgram')} *
                                </label>
                                {loadingProgrammes ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-gray-500 text-sm">{t('registration:studentRegistration.placeholders.studyProgram')}</span>
                                    </div>
                                ) : (
                                    <select
                                        name="programmeEtudes"
                                        value={formData.programmeEtudes}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled={loading}
                                    >
                                        <option value="">{t('registration:studentRegistration.placeholders.studyProgram')}</option>
                                        {programmes.map(key => (
                                            <option key={key} value={key}>
                                                {tProgrammes(key)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('registration:studentRegistration.fields.studyYear')} *
                                    </label>
                                    <select
                                        name="anneeEtude"
                                        value={formData.anneeEtude}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled={loading}
                                    >
                                        <option value="">{t('registration:studentRegistration.placeholders.studyYear')}</option>
                                        <option value="1ère année">{t('registration:studentRegistration.options.studyYears.year1')}</option>
                                        <option value="2ème année">{t('registration:studentRegistration.options.studyYears.year2')}</option>
                                        <option value="3ème année">{t('registration:studentRegistration.options.studyYears.year3')}</option>
                                        <option value="4ème année">{t('registration:studentRegistration.options.studyYears.year4')}</option>
                                        <option value="5ème année">{t('registration:studentRegistration.options.studyYears.year5')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('registration:studentRegistration.fields.session')} *
                                    </label>
                                    <select
                                        name="session"
                                        value={formData.session}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled={loading}
                                    >
                                        <option value="">{t('registration:studentRegistration.placeholders.session')}</option>
                                        <option value="Automne">{t('registration:studentRegistration.options.sessions.fall')}</option>
                                        <option value="Hiver">{t('registration:studentRegistration.options.sessions.winter')}</option>
                                        <option value="Été">{t('registration:studentRegistration.options.sessions.summer')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                                {t('registration:studentRegistration.sections.accountSecurity')}
                            </h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:studentRegistration.fields.password')} *
                                </label>
                                <input
                                    type="password"
                                    name="motDePasse"
                                    value={formData.motDePasse}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                        passwordErrors.length > 0 ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder={t('registration:studentRegistration.placeholders.password')}
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
                                    <p className="mt-2 text-green-600 text-xs">✓ {t('registration:studentRegistration.validation.passwordValid')}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('registration:studentRegistration.fields.confirmPassword')} *
                                </label>
                                <input
                                    type="password"
                                    name="confirmerMotDePasse"
                                    value={formData.confirmerMotDePasse}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder={t('registration:studentRegistration.placeholders.confirmPassword')}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || loadingProgrammes}
                                className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('registration:studentRegistration.buttons.creating')}
                                    </>
                                ) : (
                                    t('registration:studentRegistration.buttons.createAccount')
                                )}
                            </button>
                            <p className="mt-4 text-center text-sm text-gray-600">
                                {t('registration:studentRegistration.backToHome')} ?{' '}
                                <NavLink to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                    {t('registration:studentRegistration.buttons.createAccount')}
                                </NavLink>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InscriptionEtudiant;