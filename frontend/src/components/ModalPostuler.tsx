import { useState } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as React from "react";

interface ModalPostulerProps {
    offreId: number;
    offreTitre: string;
    onClose: () => void;
    onSuccess: () => void;
    onPostuler: (offreId: number, lettreMotivation?: File) => Promise<void>;
}

const ModalPostuler = ({ offreId, offreTitre, onClose, onSuccess, onPostuler }: ModalPostulerProps) => {
    const { t } = useTranslation(['offresStageApprouve', 'errors']);
    const [lettreMotivation, setLettreMotivation] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            if (file.type !== 'application/pdf') {
                setError(t('offresStageApprouve:postuler.errors.pdfOnly') || 'Seuls les fichiers PDF sont acceptés');
                setLettreMotivation(null);
                return;
            }

            const tailleMaxMo = 5;
            if (file.size > tailleMaxMo * 1024 * 1024) {
                setError(t('offresStageApprouve:postuler.errors.maxSize', { size: tailleMaxMo }) || `La taille maximale est de ${tailleMaxMo} MB`);
                setLettreMotivation(null);
                return;
            }

            setLettreMotivation(file);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            await onPostuler(offreId, lettreMotivation || undefined);
            onSuccess();
        } catch (err: any) {
            const errorCode = err?.response?.data?.erreur?.errorCode;
            if (errorCode) {
                // Chercher d'abord dans le namespace 'errors'
                const translatedError = t(`errors:${errorCode}`, { defaultValue: '' });

                if (translatedError) {
                    setError(translatedError);
                } else {
                    // Fallback sur le message du backend
                    setError(err.response.data.erreur.message || 'Erreur inconnue');
                }
            } else {
                setError(err.message || t('offresStageApprouve:postuler.errors.submitFailed') || 'Erreur lors de la candidature');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {t('offresStageApprouve:postuler.title') || 'Postuler à l\'offre'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer
                        text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                        {t('offresStageApprouve:postuler.subtitle') || 'Vous postulez pour'}:
                    </p>
                    <p className="font-semibold text-gray-900">{offreTitre}</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('offresStageApprouve:postuler.lettreMotivation') || 'Lettre de motivation'} {' '}
                        <span className="text-gray-500 font-normal">
                            ({t('offresStageApprouve:postuler.optional') || 'optionnel'})
                        </span>
                    </label>

                    <label
                        htmlFor="lettre-input"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {lettreMotivation ? (
                                <>
                                    <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                                    <p className="text-sm text-slate-600 font-semibold">
                                        {lettreMotivation.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {(lettreMotivation.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">
                                            {t('offresStageApprouve:postuler.clickToUpload') || 'Cliquer pour téléverser'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {t('offresStageApprouve:postuler.pdfOnly') || 'PDF uniquement (max 5MB)'}
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            id="lettre-input"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileSelect}
                            disabled={loading}
                            className="hidden"
                        />
                    </label>

                    {lettreMotivation && (
                        <button
                            onClick={() => {
                                setLettreMotivation(null);
                                const input = document.getElementById('lettre-input') as HTMLInputElement;
                                if (input) input.value = '';
                            }}
                            disabled={loading}
                            className="cursor-pointer mt-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                            {t('offresStageApprouve:postuler.removeFile') || 'Retirer le fichier'}
                        </button>
                    )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800">
                            {t('offresStageApprouve:postuler.cvInfo') || 'Votre CV approuvé sera automatiquement inclus dans votre candidature.'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-400 disabled:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {t('offresStageApprouve:postuler.submitting') || 'Envoi en cours...'}
                            </span>
                        ) : (
                            t('offresStageApprouve:postuler.submit') || 'Soumettre ma candidature'
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="cursor-pointer flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-200 text-gray-800 font-medium py-3 rounded-xl transition-all duration-200"
                    >
                        {t('offresStageApprouve:postuler.cancel') || 'Annuler'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalPostuler;