import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Phone, Calendar, AlertCircle, Users, BookOpen, Download, FileX } from "lucide-react";
import { professeurService, type EtudiantDTO } from "../services/ProfesseurService";
import NavBar from "./NavBar.tsx";
import { useTranslation } from "react-i18next";

const DashboardProfesseur = () => {
    const { t, i18n } = useTranslation("dashboardProfesseur");
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [professorName, setProfessorName] = useState("");
    const [downloadingCV, setDownloadingCV] = useState<number | null>(null);
    const token = sessionStorage.getItem("authToken") || "";

    // Debug: Log i18n status
    useEffect(() => {
        console.log("Current language:", i18n.language);
        console.log("Available namespaces:", i18n.options.ns);
        console.log("Test translation 'title':", t('title'));
        console.log("i18n resources:", i18n.store.data);
    }, [i18n, t]);

    const chargerEtudiants = async () => {
        try {
            setLoading(true);
            const data = await professeurService.getMesEtudiants(token);
            setEtudiants(data);
        } catch (e: any) {
            setError(e.message || t('error.unknown'));
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
            setError(t('error.authTokenMissing'));
            return;
        }

        chargerEtudiants();
    }, [navigate, token]);

    const handleDownloadCV = async (etudiant: EtudiantDTO) => {
        if (!etudiant.id) return;

        try {
            setDownloadingCV(etudiant.id);

            const blob = await professeurService.telechargerCV(etudiant.id, token);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `CV_${etudiant.prenom}_${etudiant.nom}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erreur lors du téléchargement du CV:', error);
            alert(t('error.downloadCVFailed'));
        } finally {
            setDownloadingCV(null);
        }
    };


    const renderCVColumn = (etudiant: EtudiantDTO) => {
        if (!etudiant.cv || etudiant.cv.length === 0) {
            return (
                <div className="flex items-center gap-2 text-gray-400">
                    <FileX className="w-4 h-4" />
                    <span className="text-sm">{t('studentList.cv.noCV')}</span>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleDownloadCV(etudiant)}
                disabled={downloadingCV === etudiant.id}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {downloadingCV === etudiant.id ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="text-sm">{t('studentList.cv.downloading')}</span>
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        <span className="text-sm">{t('studentList.cv.download')}</span>
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                        {professorName && ` - ${professorName}`}
                    </h1>
                    <p className="text-gray-600">
                        {t('subtitle')}
                    </p>
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
                            {t('studentList.title')}
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
                            <p className="text-gray-600">{t('studentList.noStudents')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.student')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.program')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.session')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        {t('studentList.contact')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        CV
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
                                            {renderCVColumn(etudiant)}
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