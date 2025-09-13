import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building, MapPin, User, Mail, Phone, Lock } from 'lucide-react'
import * as React from "react";

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
    const [formData, setFormData] = useState<FormData>({
        nomEntreprise: '',
        adresseEntreprise: '',
        prenomContact: '',
        nomContact: '',
        emailProfessionnel: '',
        telephone: '',
        motDePasse: '',
        confirmerMotDePasse: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Soumis')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
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
                        Inscription Employeur
                    </h1>
                    <p className="text-gray-600">
                        Créez votre compte employeur pour publier des offres de stage.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Colonne gauche */}
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Building className="w-4 h-4 mr-2 text-blue-600" />
                                    Informations de l'entreprise
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom de l'entreprise *
                                    </label>
                                    <input
                                        type="text"
                                        name="nomEntreprise"
                                        value={formData.nomEntreprise}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="Ex: Tech Solutions Inc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <MapPin className="inline w-4 h-4 mr-1" />
                                        Adresse de l'entreprise *
                                    </label>
                                    <input
                                        type="text"
                                        name="adresseEntreprise"
                                        value={formData.adresseEntreprise}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="123 Rue de l'Innovation, Ville, Code Postal"
                                    />
                                </div>
                            </div>

                            {/* Personne contact */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <User className="w-4 h-4 mr-2 text-blue-600" />
                                    Personne de contact
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            name="prenomContact"
                                            value={formData.prenomContact}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="Jean"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            name="nomContact"
                                            value={formData.nomContact}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="Dupont"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonne droite */}
                        <div className="space-y-4">
                            {/* Informations de contact */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Informations de contact
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Mail className="inline w-4 h-4 mr-1" />
                                        Adresse courriel professionnelle *
                                    </label>
                                    <input
                                        type="email"
                                        name="emailProfessionnel"
                                        value={formData.emailProfessionnel}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="jean.dupont@entreprise.com"
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
                                    />
                                </div>
                            </div>

                            {/* Sécurité */}
                            <div className="space-y-3">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="Minimum 8 caractères"
                                    />
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
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit button - sur toute la largeur */}
                        <div className="lg:col-span-2 pt-4">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
                            >
                                Créer mon compte employeur
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default InscriptionEmployeur