import {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import {ArrowLeft, User, Mail, Lock, GraduationCap, Phone} from 'lucide-react'
import * as React from "react";
import etudiantService from '../services/EtudiantService';
import utilisateurService from '../services/UtilisateurService'; // AJOUT IMPORTANT
import {NavLink} from "react-router";

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
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Add state for programs
    const [programmes, setProgrammes] = useState<{[key: string]: string}>({});
    const [loadingProgrammes, setLoadingProgrammes] = useState(true);

    // États pour la validation du mot de passe
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    // Load programs on component mount
    useEffect(() => {
        const loadProgrammes = async () => {
            try {
                setLoadingProgrammes(true);
                const programmesData = await utilisateurService.getAllProgrammes();
                setProgrammes(programmesData);
            } catch (error) {
                console.error('Erreur lors du chargement des programmes:', error);
                setErrors(['Erreur lors du chargement des programmes']);
            } finally {
                setLoadingProgrammes(false);
            }
        };

        loadProgrammes();
    }, []);

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
        if (!formData.anneeEtude.trim()) {
            validationErrors.push('L\'année/session d\'étude est requise');
        }
        if (!formData.session.trim()) {
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
            // Formater les données pour l'API d'inscription
            const apiData = etudiantService.formatFormDataForAPI(formData);

            // 1. Créer le compte étudiant
            const inscriptionResponse = await etudiantService.creerCompte(apiData);

            if (inscriptionResponse) {
                setSuccessMessage('Compte créé avec succès !');

                // 2. Connexion automatique après inscription réussie
                try {
                    const loginData = {
                        email: formData.email,
                        password: formData.motDePasse
                    };

                    const authResponse = await utilisateurService.authentifier(loginData);

                    if (authResponse) {
                        setSuccessMessage('Compte créé et connexion automatique réussie !');

                        // Définir le flag pour indiquer que l'utilisateur vient d'une inscription
                        sessionStorage.setItem('fromRegistration', 'true');

                        // Redirection vers le dashboard étudiant
                        setTimeout(() => {
                            navigate('/dashboard-etudiant');
                        }, 2000);
                    } else {
                        // Si la connexion automatique échoue, rediriger vers login
                        setSuccessMessage('Compte créé ! Veuillez vous connecter.');
                        setTimeout(() => {
                            navigate('/login');
                        }, 2000);
                    }

                } catch (loginError) {
                    console.error('Erreur lors de la connexion automatique:', loginError);
                    setSuccessMessage('Compte créé ! Veuillez vous connecter.');
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            }

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
                    <NavLink
                        to="/"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </NavLink>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Inscription Étudiant
                    </h1>
                    <p className="text-gray-600">
                        Créez votre compte étudiant pour accéder aux offres de stage.
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
                        <p className="text-green-600 text-sm mt-1">Redirection...</p>
                    </div>
                )}

                {/* Formulaire d'inscription */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations personnelles */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <User className="w-4 h-4 mr-2 text-blue-600" />
                                Informations personnelles
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <Phone className="inline w-4 h-4 mr-1" />
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
                                {loadingProgrammes ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-gray-500 text-sm">Chargement des programmes...</span>
                                    </div>
                                ) : (
                                    <select
                                        name="programmeEtudes"
                                        value={formData.programmeEtudes}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled={loading}
                                    >
                                        <option value="">Sélectionnez votre programme</option>
                                        {Object.entries(programmes).map(([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Année d'étude *
                                    </label>
                                    <select
                                        name="anneeEtude"
                                        value={formData.anneeEtude}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled={loading}
                                    >
                                        <option value="">Sélectionnez...</option>
                                        <option value="1ère année">1ère année</option>
                                        <option value="2ème année">2ème année</option>
                                        <option value="3ème année">3ème année</option>
                                        <option value="4ème année">4ème année</option>
                                        <option value="5ème année">5ème année</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Session *
                                    </label>
                                    <select
                                        name="session"
                                        value={formData.session}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled={loading}
                                    >
                                        <option value="">Sélectionnez...</option>
                                        <option value="Automne">Automne</option>
                                        <option value="Hiver">Hiver</option>
                                        <option value="Été">Été</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Sécurité */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                                Sécurité du compte
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                        passwordErrors.length > 0 ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Votre mot de passe sécurisé"
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
                                    <p className="mt-2 text-green-600 text-xs">✓ Mot de passe valide</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Confirmez votre mot de passe"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || loadingProgrammes}
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
                                <NavLink to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Se connecter
                                </NavLink>
                            </p>
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
                                    Création en cours...
                                </>
                            ) : (
                                'Créer mon compte'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InscriptionEtudiant;