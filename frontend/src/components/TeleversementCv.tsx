import { useState, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import etudiantService from "../services/EtudiantService.ts";
import NavBar from "./NavBar.tsx";
import * as React from "react";

const TeleversementCv = () => {
    const navigate = useNavigate();
    const [fichier, setFichier] = useState<File | null>(null);
    const [chargement, setChargement] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; texte: string } | null>(null);
    const [cvExistant, setCvExistant] = useState<boolean>(false);

    const handleSelectionFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fichierSelectionne = e.target.files?.[0];

        if (fichierSelectionne) {
            // Vérifier que c'est un PDF
            if (fichierSelectionne.type !== 'application/pdf') {
                setMessage({ type: 'error', texte: 'Veuillez sélectionner un fichier PDF' });
                setFichier(null);
                return;
            }

            // Vérifier la taille (max 5MB)
            const tailleMaxMo = 5;
            if (fichierSelectionne.size > tailleMaxMo * 1024 * 1024) {
                setMessage({ type: 'error', texte: `Le fichier ne doit pas dépasser ${tailleMaxMo}MB` });
                setFichier(null);
                return;
            }

            setFichier(fichierSelectionne);
            setMessage(null);
        }
    };

    const handleTeleversement = async () => {
        if (!fichier) {
            setMessage({ type: 'error', texte: 'Veuillez sélectionner un fichier' });
            return;
        }

        setChargement(true);
        setMessage(null);

        try {
            const resultat = await etudiantService.uploadCv(fichier);
            setMessage({ type: 'success', texte: resultat.message || 'CV téléversé avec succès' });
            setCvExistant(true);
            setFichier(null);

            // Réinitialiser l'input file
            const inputFile = document.getElementById('cv-input') as HTMLInputElement;
            if (inputFile) inputFile.value = '';

        } catch (error) {
            setMessage({
                type: 'error',
                texte: error instanceof Error ? error.message : 'Erreur lors du téléversement'
            });
        } finally {
            setChargement(false);
        }
    };

    const handleTelechargerCv = async () => {
        setChargement(true);
        try {
            await etudiantService.telechargerCv();
            setMessage({ type: 'success', texte: 'CV téléchargé avec succès' });
        } catch (error) {
            setMessage({
                type: 'error',
                texte: error instanceof Error ? error.message : 'Erreur lors du téléchargement'
            });
        } finally {
            setChargement(false);
        }
    };

    const verifierCvExistant = async () => {
        try {
            const existe = await etudiantService.verifierCvExiste();
            setCvExistant(existe);
        } catch (error) {
            console.error('Erreur lors de la vérification du CV:', error);
        }
    };

    // Vérifier si un CV existe au chargement du composant
    useEffect(() => {
        verifierCvExistant().then();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Bouton retour */}
                <button
                    onClick={() => navigate('/dashboard-etudiant')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Retour au tableau de bord</span>
                </button>

                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Mon CV
                    </h1>
                    <p className="text-gray-600">
                        Gérez votre curriculum vitae pour postuler aux offres de stage
                    </p>
                </div>

                {/* Message de notification */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        <p className="font-medium flex-1">{message.texte}</p>
                        <button
                            onClick={() => setMessage(null)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Carte de téléversement */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-50 p-3 rounded-xl">
                                <Upload className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {cvExistant ? 'Mettre à jour mon CV' : 'Téléverser mon CV'}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Format PDF, max 5MB
                                </p>
                            </div>
                        </div>

                        {/* Zone de drop */}
                        <div className="mb-6">
                            <label
                                htmlFor="cv-input"
                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileText className="w-10 h-10 text-slate-400 mb-3" />
                                    <p className="mb-2 text-sm text-slate-600">
                                        <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        PDF uniquement (max 5MB)
                                    </p>
                                </div>
                                <input
                                    id="cv-input"
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleSelectionFichier}
                                    disabled={chargement}
                                    className="hidden"
                                />
                            </label>

                            {fichier && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{fichier.name}</p>
                                                <p className="text-xs text-gray-600">{(fichier.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFichier(null);
                                                const inputFile = document.getElementById('cv-input') as HTMLInputElement;
                                                if (inputFile) inputFile.value = '';
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bouton de téléversement */}
                        <button
                            onClick={handleTeleversement}
                            disabled={!fichier || chargement}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium
                                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                                     focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed
                                     transition-all duration-200 shadow-sm hover:shadow disabled:shadow-none"
                        >
                            {chargement ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Téléversement en cours...
                                </span>
                            ) : cvExistant ? 'Remplacer mon CV' : 'Téléverser le CV'}
                        </button>

                        {cvExistant && (
                            <p className="mt-3 text-xs text-center text-amber-600">
                                ⚠️ Le nouveau CV remplacera votre CV actuel
                            </p>
                        )}
                    </div>

                    {/* Carte CV existant */}
                    {cvExistant ? (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-green-50 p-3 rounded-xl">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        CV actuel
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Votre CV est disponible
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-900 mb-1">
                                            CV disponible
                                        </p>
                                        <p className="text-xs text-green-700">
                                            Vous pouvez postuler aux offres de stage avec ce CV
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleTelechargerCv}
                                disabled={chargement}
                                className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium
                                         hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                                         focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed
                                         transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Télécharger mon CV
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-slate-100 p-3 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-slate-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Informations
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                        Format accepté: <span className="font-medium">PDF uniquement</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                        Taille maximale: <span className="font-medium">5 MB</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                        Un CV est <span className="font-medium">requis</span> pour postuler aux offres
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeleversementCv;