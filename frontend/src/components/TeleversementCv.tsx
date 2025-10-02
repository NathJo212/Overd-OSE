import { useState } from 'react';
import etudiantService from "../services/EtudiantService.ts";


const TeleversementCv = () => {
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
    useState(() => {
        verifierCvExistant();
    });

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Téléversement de CV
            </h2>

            {/* Message de retour */}
            {message && (
                <div className={`mb-4 p-4 rounded-md ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    <p className="font-medium">{message.texte}</p>
                </div>
            )}

            {/* Zone de sélection de fichier */}
            <div className="mb-6">
                <label
                    htmlFor="cv-input"
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Sélectionner votre CV (PDF uniquement, max 5MB)
                </label>

                <input
                    id="cv-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleSelectionFichier}
                    disabled={chargement}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                             file:rounded-md file:border-0 file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {fichier && (
                    <p className="mt-2 text-sm text-gray-600">
                        Fichier sélectionné: <span className="font-medium">{fichier.name}</span>
                        {' '}({(fichier.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                )}
            </div>

            {/* Bouton de téléversement */}
            <button
                onClick={handleTeleversement}
                disabled={!fichier || chargement}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors duration-200"
            >
                {chargement ? 'Téléversement en cours...' : 'Téléverser le CV'}
            </button>

            {/* Section pour télécharger le CV existant */}
            {cvExistant && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        CV existant
                    </h3>
                    <button
                        onClick={handleTelechargerCv}
                        disabled={chargement}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium
                                 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                                 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed
                                 transition-colors duration-200"
                    >
                        Télécharger mon CV actuel
                    </button>
                </div>
            )}

            {/* Informations supplémentaires */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Informations importantes:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Format accepté: PDF uniquement</li>
                    <li>Taille maximale: 5 MB</li>
                    <li>Le nouveau CV remplacera l'ancien si vous en avez déjà téléversé un</li>
                </ul>
            </div>
        </div>
    );
};

export default TeleversementCv;