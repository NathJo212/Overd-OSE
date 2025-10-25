import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import etudiantService from "../services/EtudiantService.ts";
import NavBar from "./NavBar.tsx";
import * as React from "react";

const TeleversementCv = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['televersementCv', 'errors']);
    const [fichier, setFichier] = useState<File | null>(null);
    const [chargement, setChargement] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; texte: string } | null>(null);
    const [cvExistant, setCvExistant] = useState<boolean>(false);
    const [statutCv, setStatutCv] = useState<string | null>(null);
    const [messageRefus, setMessageRefus] = useState<string | null>(null);
    const [showCVModal, setShowCVModal] = useState(false);
    const [cvData, setCvData] = useState<string | null>(null);

    const handleSelectionFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fichierSelectionne = e.target.files?.[0];

        if (fichierSelectionne) {
            // Vérifier que c'est un PDF
            if (fichierSelectionne.type !== 'application/pdf') {
                setMessage({ type: 'error', texte: t('cv.errors.pdfOnly') });
                setFichier(null);
                return;
            }

            // Vérifier la taille (max 5MB)
            const tailleMaxMo = 5;
            if (fichierSelectionne.size > tailleMaxMo * 1024 * 1024) {
                setMessage({ type: 'error', texte: t('cv.errors.maxSize', { size: tailleMaxMo }) });
                setFichier(null);
                return;
            }

            setFichier(fichierSelectionne);
            setMessage(null);
        }
    };

    const handleTeleversement = async () => {
        if (!fichier) {
            setMessage({ type: 'error', texte: t('cv.errors.selectFile') });
            return;
        }

        setChargement(true);
        setMessage(null);

        try {
            await etudiantService.uploadCv(fichier);
            setMessage({ type: 'success', texte: t('cv.success.uploaded') });
            setCvExistant(true);
            setFichier(null);

            // Réinitialiser l'input file
            const inputFile = document.getElementById('cv-input') as HTMLInputElement;
            if (inputFile) inputFile.value = '';
            const infos = await etudiantService.getInfosCv();
            setStatutCv(infos?.statutCV ?? null);
            setMessageRefus(infos?.messageRefusCV ?? null);
        } catch (error) {
            setMessage({
                type: 'error',
                texte: error instanceof Error ? error.message : t('cv.errors.uploadFailed')
            });
        } finally {
            setChargement(false);
        }
    };

    const handleShowCV = async () => {
        setChargement(true);
        try {
            const cv = await etudiantService.regarderCV();
            setCvData(cv);
            setShowCVModal(true);
        } catch (error) {
            setMessage({
                type: 'error',
                texte: error instanceof Error ? error.message : t('cv.errors.downloadFailed')
            });
        } finally {
            setChargement(false);
        }
    };

    const closeCVModal = () => {
        setShowCVModal(false);
        setCvData(null);
    };


    const verifierCvExistant = async () => {
        try {
            const existe = await etudiantService.verifierCvExiste();
            setCvExistant(existe);
        } catch (error) {
            console.error('Erreur lors de la vérification du CV:', error);
        }
    };

    // Vérifier si un CV existe au chargement du composant et vérification du statut du cv
    useEffect(() => {
        const token = sessionStorage.getItem("authToken");
        const role = sessionStorage.getItem("userType");

        if (!token || role !== "ETUDIANT") {
            navigate("/login");
            return;
        }

        const chargerInfosCv = async () => {
            await verifierCvExistant();
            const infos = await etudiantService.getInfosCv();
            setStatutCv(infos?.statutCV ?? null);
            setMessageRefus(infos?.messageRefusCV ?? null);
        };
        chargerInfosCv();
    }, [navigate]);

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Bouton retour */}
                <button
                    onClick={() => navigate('/dashboard-etudiant')}
                    className="cursor-pointer mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">{t('cv.backToDashboard')}</span>
                </button>

                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('cv.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('cv.subtitle')}
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
                            className="cursor-pointer text-gray-500 hover:text-gray-700"
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
                                    {cvExistant ? t('cv.upload.updateTitle') : t('cv.upload.title')}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {t('cv.upload.format')}
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
                                        <span className="font-semibold">{t('cv.upload.clickToSelect')}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {t('cv.upload.pdfOnly')}
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
                                            className="cursor-pointer text-red-500 hover:text-red-700"
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
                            className="cursor-pointer w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium
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
                                    {t('cv.upload.uploading')}
                                </span>
                            ) : cvExistant ? t('cv.upload.replaceButton') : t('cv.upload.uploadButton')}
                        </button>

                        {cvExistant && (
                            <p className="mt-3 text-xs text-center text-amber-600">
                                ⚠️ {t('cv.upload.replaceWarning')}
                            </p>
                        )}
                    </div>

                    {/* Affichage selon le statut du CV */}
                    {statutCv === 'APPROUVE' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            {/* Carte CV approuvé */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-green-50 p-3 rounded-xl">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {t('cv.current.title')}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {t('cv.current.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-900 mb-1">
                                            {t('cv.current.available')}
                                        </p>
                                        <p className="text-xs text-green-700">
                                            {t('cv.current.canApply')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleShowCV}
                                disabled={chargement}
                                className="cursor-pointer w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium
                     hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                     focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                {t('cv.current.previewButton')}
                            </button>
                        </div>
                    )}

                    {statutCv === 'REFUSE' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            {/* Carte CV refusé */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-red-50 p-3 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {t('cv.refused.title')}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {t('cv.refused.subtitle')}
                                    </p>
                                </div>
                            </div>
                            {messageRefus && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-sm font-medium text-red-800">
                                        {t('cv.refused.reason', { reason: messageRefus })}
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={handleShowCV}
                                disabled={chargement}
                                className="cursor-pointer mt-6 w-full bg-red-600 text-white py-3 px-4 rounded-xl font-medium
                hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                {t('cv.current.previewButton')}
                            </button>
                        </div>
                    )}

                    {statutCv === 'ATTENTE' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            {/* Carte CV en attente */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-amber-50 p-3 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {t('cv.pending.title')}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {t('cv.pending.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleShowCV}
                                disabled={chargement}
                                className="cursor-pointer mt-6 w-full bg-amber-600 text-white py-3 px-4 rounded-xl font-medium
                hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500
                focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                {t('cv.current.previewButton')}
                            </button>
                        </div>
                    )}

                    {(!statutCv || statutCv === 'AUCUN') && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            {/* Carte info si aucun CV */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-slate-100 p-3 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-slate-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {t('cv.info.title')}
                                    </h2>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                        {t('cv.info.acceptedFormat')}: <span className="font-medium">{t('cv.info.pdfOnly')}</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                        {t('cv.info.maxSize')}: <span className="font-medium">5 MB</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">
                                        {t('cv.info.cvRequired')} <span className="font-medium">{t('cv.info.required')}</span> {t('cv.info.toApply')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {showCVModal && cvData && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                                    <h3 className="text-xl font-semibold">{t("cv.current.previewTitle")}</h3>
                                    <button onClick={closeCVModal} className="cursor-pointer text-white hover:text-gray-200">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                                    <iframe
                                        src={`data:application/pdf;base64,${cvData}`}
                                        className="w-full h-[600px] border rounded"
                                        title="CV Preview"
                                        allow="fullscreen"
                                    />
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
