import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Phone, Calendar, AlertCircle, Users, BookOpen } from "lucide-react";
import { professeurService, type EtudiantDTO } from "../services/ProfesseurService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

const DashboardProfesseur = () => {
    const { t } = useTranslation(["dashboardProfesseur"]);
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [professorName, setProfessorName] = useState("");
    const token = sessionStorage.getItem("authToken") || "";

    // Get professor ID from JWT token
    const getProfesseurId = (): number | null => {
        try {
            const userData = sessionStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                // Try to get id from userData first
                if (user.id) {
                    return user.id;
                }
            }

            // Fallback: decode token
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('JWT Payload:', payload); // Debug log
            return payload.userId || payload.id || payload.sub || null;
        } catch (e) {
            console.error('Unable to decode token:', e);
            return null;
        }
    };

    const chargerEtudiants = async () => {
        const professeurId = getProfesseurId();
        if (!professeurId) {
            setError("Impossible de récupérer l'ID du professeur");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await professeurService.getMesEtudiants(professeurId, token);
            setEtudiants(data);
        } catch (e: any) {
            setError(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "PROFESSEUR") {
            navigate("/login");
            return;
        }

        // Get professor name from userData
        try {
            const userData = sessionStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                const prenom = user.prenom || '';
                const nom = user.nom || '';
                const fullName = `${prenom} ${nom}`.trim();
                if (fullName) {
                    setProfessorName(fullName);
                }
            }
        } catch (e) {
            console.warn('Unable to parse userData', e);
        }

        if (!token) {
            setError("Token d'authentification manquant");
            return;
        }

        chargerEtudiants();
    }, [navigate, token]);

    const getStatutCVBadge = (statut?: string) => {
        switch (statut) {
            case 'APPROUVE':
                return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Approuvé</span>;
            case 'REFUSE':
                return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Refusé</span>;
            case 'ATTENTE':
                return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">En attente</span>;
            case 'AUCUN':
                return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Aucun CV</span>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title') || 'Tableau de bord Professeur'}
                        {professorName && ` - ${professorName}`}
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle') || 'Gérez vos étudiants et suivez leurs progrès'}
                    </p>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{t('stats.totalStudents') || 'Total Étudiants'}</p>
                                <p className="text-3xl font-bold text-blue-600">{etudiants.length}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{t('stats.approvedCV') || 'CV Approuvés'}</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {etudiants.filter(e => e.statutCV === 'APPROUVE').length}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl">
                                <GraduationCap className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{t('stats.pendingCV') || 'CV En Attente'}</p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {etudiants.filter(e => e.statutCV === 'ATTENTE').length}
                                </p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-xl">
                                <BookOpen className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                    </div>
                )}

                {/* Liste des étudiants */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            {t('studentList.title') || 'Mes Étudiants'}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="relative">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                            </div>
                        </div>
                    ) : etudiants.length === 0 ? (
                        <div className="p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-gray-600">{t('studentList.noStudents') || 'Aucun étudiant assigné pour le moment'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.student') || 'Étudiant'}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.program') || 'Programme'}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.session') || 'Session'}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.contact') || 'Contact'}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.cvStatus') || 'Statut CV'}
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                {etudiants.map((etudiant) => (
                                    <tr key={etudiant.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {etudiant.prenom} {etudiant.nom}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{etudiant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                    <BookOpen className="w-3 h-3" />
                                                    {etudiant.progEtude || 'N/A'}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{etudiant.session} {etudiant.annee}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-xs">{etudiant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-3 h-3" />
                                                    <span className="text-xs">{etudiant.telephone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatutCVBadge(etudiant.statutCV)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardProfesseur;