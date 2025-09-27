import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gestionnaireService, type OffreDTO } from "../services/GestionnaireService";
import NavBar from "./NavBar.tsx";

const OffresDeStagesGestionnaire = () => {
    const navigate = useNavigate();
    const [offres, setOffres] = useState<OffreDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [actionMessage, setActionMessage] = useState<string>("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [refuseReason, setRefuseReason] = useState("");
    const [refuseTargetId, setRefuseTargetId] = useState<number | null>(null);
    const [refuseError, setRefuseError] = useState("");
    const token = sessionStorage.getItem("authToken") || "";

    const chargerOffres = async () => {
        try {
            setLoading(true);
            const data = await gestionnaireService.getAllOffresDeStages(token);
            setOffres(data);
        } catch (e:any) {
            setError(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "GESTIONNAIRE") {
            navigate("/login");
            return;
        }
        if (!token) {
            setError("Token d'authentification manquant");
            return;
        }
        chargerOffres();
    }, [navigate, token]);

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        setActionMessage("");
        try {
            await gestionnaireService.approuverOffre(id, token);
            setActionMessage("Offre approuvée avec succès");
            await chargerOffres();
        } catch (e:any) {
            setError(e.message || "Erreur lors de l'approbation");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefuseClick = (id: number) => {
        setRefuseTargetId(id);
        setRefuseReason("");
        setRefuseError("");
        setShowRefuseModal(true);
    };

    const submitRefuse = async () => {
        if (!refuseReason.trim()) {
            setRefuseError("La raison est obligatoire.");
            return;
        }
        if (refuseTargetId == null) return;
        setProcessingId(refuseTargetId);
        setActionMessage("");
        setRefuseError("");
        try {
            await gestionnaireService.refuserOffre(refuseTargetId, refuseReason.trim(), token);
            setActionMessage("Offre refusée avec succès");
            setShowRefuseModal(false);
            await chargerOffres();
        } catch (e:any) {
            setError(e.message || "Erreur lors du refus");
        } finally {
            setProcessingId(null);
        }
    };

    const cancelRefuse = () => {
        setShowRefuseModal(false);
        setRefuseReason("");
        setRefuseTargetId(null);
        setRefuseError("");
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showRefuseModal) {
                cancelRefuse();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showRefuseModal]);

    return (
        <>
            <NavBar/>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center py-10 px-4">
                <div className="w-full max-w-5xl">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Offres de stages en attente</h1>
                        <p className="text-gray-600">Gérez les offres en attente d'approbation.</p>
                    </div>

                    {actionMessage && (
                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm font-medium">
                            {actionMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-300 border-t-indigo-600" />
                        </div>
                    ) : offres.length === 0 ? (
                        <div className="text-center text-gray-500 bg-white rounded-xl p-10 shadow-sm">Aucune offre trouvée.</div>
                    ) : (
                        <ul className="grid gap-6 md:grid-cols-2">
                            {offres.map(offre => (
                                <li key={offre.id} className="relative group border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <h2 className="text-lg font-semibold text-gray-800 pr-2">{offre.titre}</h2>
                                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">En attente</span>
                                    </div>
                                    <div className="mb-3 text-sm text-gray-600 bg-gray-50 rounded-md p-3 border border-gray-100">
                                        <div className="font-medium text-gray-700">Employeur:</div>
                                        <div>{offre.employeurDTO?.nomEntreprise}</div>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                            {offre.employeurDTO?.contact && (
                                                <span className="inline-block text-xs text-gray-500">Contact: {offre.employeurDTO?.contact}</span>
                                            )}
                                            {offre.employeurDTO?.email && (
                                                <span className="inline-block text-xs text-gray-500">Email: {offre.employeurDTO?.email}</span>
                                            )}
                                            {offre.employeurDTO?.telephone && (
                                                <span className="inline-block text-xs text-gray-500">Tél: {offre.employeurDTO?.telephone}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3 leading-relaxed line-clamp-4">{offre.description}</p>
                                    <div className="grid grid-cols-1 text-sm gap-1 mb-4 text-gray-600">
                                        <div><span className="font-medium text-gray-700">Lieu:</span> {offre.lieuStage || '—'}</div>
                                        <div><span className="font-medium text-gray-700">Début:</span> {offre.date_debut}</div>
                                        <div><span className="font-medium text-gray-700">Fin:</span> {offre.date_fin}</div>
                                        {offre.remuneration && (
                                            <div><span className="font-medium text-gray-700">Rémunération:</span> {offre.remuneration}</div>
                                        )}
                                        {offre.dateLimite && (
                                            <div><span className="font-medium text-gray-700">Date limite:</span> {offre.dateLimite}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleApprove(offre.id)}
                                            disabled={processingId === offre.id}
                                            className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2.5 transition-colors"
                                        >
                                            {processingId === offre.id ? '...' : 'Approuver'}
                                        </button>
                                        <button
                                            onClick={() => handleRefuseClick(offre.id)}
                                            disabled={processingId === offre.id}
                                            className="flex-1 inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium py-2.5 transition-colors"
                                        >
                                            {processingId === offre.id ? '...' : 'Refuser'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {showRefuseModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) cancelRefuse();
                    }}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative animate-fade-in"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="refuse-title"
                    >
                        <h2 id="refuse-title" className="text-xl font-semibold text-gray-800 mb-2">Refuser l'offre</h2>
                        <p id="refuse-help" className="text-sm text-gray-600 mb-4">Entrez la raison du refus. Elle pourra être communiquée à l'employeur.</p>
                        <label htmlFor="refuse-reason" className="block text-sm font-medium text-gray-700 mb-1">Raison du refus</label>
                        <textarea
                            id="refuse-reason"
                            aria-describedby="refuse-help"
                            value={refuseReason}
                            onChange={(e) => { setRefuseReason(e.target.value); if (refuseError) setRefuseError(''); }}
                            rows={4}
                            className="w-full resize-none rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm outline-none"
                            placeholder="Ex: Informations insuffisantes, dates incohérentes, etc."
                            autoFocus
                        />
                        {refuseError && <div className="text-sm text-red-600 mt-2">{refuseError}</div>}
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={submitRefuse}
                                disabled={processingId !== null}
                                className="flex-1 inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 text-sm transition-colors"
                            >
                                {processingId !== null ? 'Envoi...' : 'Confirmer'}
                            </button>
                            <button
                                onClick={cancelRefuse}
                                disabled={processingId !== null}
                                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 text-gray-800 font-medium py-2.5 text-sm transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                        <button
                            onClick={cancelRefuse}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Fermer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default OffresDeStagesGestionnaire;
