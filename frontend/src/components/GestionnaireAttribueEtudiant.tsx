import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gestionnaireService } from '../services/GestionnaireService.ts';
import type { EtudiantDTO, ProfesseurDTO } from '../services/GestionnaireService.ts';
import { useTranslation } from "react-i18next";
import UtilisateurService from "../services/UtilisateurService.ts";
import { UserCheck, Users, GraduationCap, Search, X, CheckCircle, AlertCircle, UserCog } from "lucide-react";
import NavBar from "./NavBar.tsx";

export default function GestionnaireAttribueEtudiant() {
    const { t } = useTranslation(["gestionnaireAttribueEtudiant"]);
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState<EtudiantDTO[]>([]);
    const [professeurs, setProfesseurs] = useState<ProfesseurDTO[]>([]);
    const [selectedProf, setSelectedProf] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<number | null>(null);

    // Alert states
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // Search states
    const [studentSearch, setStudentSearch] = useState("");
    const [teacherSearch, setTeacherSearch] = useState<Record<number, string>>({});

    const token = UtilisateurService.getToken();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "GESTIONNAIRE") {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            if (!token) {
                setAlert({
                    type: 'error',
                    message: t("error") || "Erreur de connexion"
                });
                return;
            }

            try {
                const [etudiantsData, profsData] = await Promise.all([
                    gestionnaireService.getAllEtudiants(token),
                    gestionnaireService.getAllProfesseurs(token),
                ]);
                setEtudiants(etudiantsData);
                setProfesseurs(profsData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setAlert({
                    type: 'error',
                    message: t("error") || "Erreur lors du chargement des données"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, t, navigate]);

    const handleAssign = async (etudiantId: number) => {
        const professeurId = selectedProf[etudiantId];
        if (!professeurId) {
            setAlert({
                type: 'error',
                message: t("selectProfessor") || "Veuillez sélectionner un professeur"
            });
            return;
        }

        if (!token) {
            setAlert({
                type: 'error',
                message: t("error") || "Erreur de connexion"
            });
            return;
        }

        setAssigning(etudiantId);
        setAlert(null);

        try {
            await gestionnaireService.assignEtudiantAProfesseur(etudiantId, professeurId, token);
            setAlert({
                type: 'success',
                message: t("assignSuccess") || "Professeur assigné avec succès!"
            });

            // Refresh the students list
            const updatedEtudiants = await gestionnaireService.getAllEtudiants(token);
            setEtudiants(updatedEtudiants);

            // Clear alert after 3 seconds
            setTimeout(() => setAlert(null), 3000);
        } catch (error: any) {
            console.error("Assignment error:", error);

            // Handle specific error messages from backend
            let errorMessage = t("assignError") || "Erreur lors de l'assignation";
            if (error.response?.data?.erreur) {
                errorMessage = error.response.data.erreur.message || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setAlert({
                type: 'error',
                message: errorMessage
            });
        } finally {
            setAssigning(null);
        }
    };

    // Filter students based on search
    const filteredEtudiants = etudiants.filter(etudiant => {
        const fullName = `${etudiant.nom} ${etudiant.prenom}`.toLowerCase();
        const email = etudiant.email.toLowerCase();
        const prog = etudiant.progEtude?.toLowerCase() || "";
        const searchLower = studentSearch.toLowerCase();

        return fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            prog.includes(searchLower);
    });

    // Filter teachers for a specific row
    const getFilteredProfesseurs = (etudiantId: number) => {
        const search = teacherSearch[etudiantId]?.toLowerCase() || "";
        if (!search) return professeurs;

        return professeurs.filter(prof => {
            const fullName = `${prof.nom} ${prof.prenom}`.toLowerCase();
            const email = prof.email.toLowerCase();
            return fullName.includes(search) || email.includes(search);
        });
    };

    // Get current teacher name for a student
    const getCurrentTeacher = (etudiant: EtudiantDTO) => {
        // First check if the etudiant has a professeur property (from backend)
        if (etudiant.professeur) {
            return `${etudiant.professeur.prenom} ${etudiant.professeur.nom}`;
        }

        // Fallback: Check if etudiantList exists on any professor
        const assignedProf = professeurs.find(prof =>
            prof.etudiantList?.some(e => e.id === etudiant.id)
        );
        return assignedProf ? `${assignedProf.prenom} ${assignedProf.nom}` : null;
    };

    if (loading) {
        return (
            <>
                <NavBar />
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Chargement...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-10 h-10 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            {t("title") || "Assigner des Professeurs aux Étudiants"}
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        {t("subtitle") || "Assignez un professeur superviseur à chaque étudiant"}
                    </p>
                </div>

                {/* Alert Messages */}
                {alert && (
                    <div className={`mb-6 p-4 rounded-xl shadow-md flex items-center gap-3 ${
                        alert.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                    }`}>
                        {alert.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <p className={`flex-1 font-medium ${
                            alert.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                            {alert.message}
                        </p>
                        <button
                            onClick={() => setAlert(null)}
                            className={`p-1 rounded-lg transition-colors ${
                                alert.type === 'success'
                                    ? 'hover:bg-green-100'
                                    : 'hover:bg-red-100'
                            }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Global Student Search Bar */}
                <div className="mb-6 bg-white rounded-xl shadow-md p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t("searchStudent") || "Rechercher un étudiant par nom, email ou programme..."}
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {studentSearch && (
                            <button
                                onClick={() => setStudentSearch("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {filteredEtudiants.length} étudiant(s) trouvé(s)
                    </p>
                </div>

                {/* Table */}
                {filteredEtudiants.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {studentSearch
                                ? (t("noStudentsFound") || "Aucun étudiant trouvé pour cette recherche")
                                : (t("noStudents") || "Aucun étudiant disponible")}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl shadow-md bg-white">
                        <table className="w-full table-auto border-collapse">
                            <thead className="bg-gradient-to-r from-blue-100 to-blue-50">
                            <tr>
                                <th className="p-4 text-left font-semibold text-gray-700">
                                    {t("student") || "Étudiant"}
                                </th>
                                <th className="p-4 text-left font-semibold text-gray-700">
                                    {t("currentTeacher") || "Professeur Actuel"}
                                </th>
                                <th className="p-4 text-left font-semibold text-gray-700">
                                    {t("program") || "Programme"}
                                </th>
                                <th className="p-4 text-left font-semibold text-gray-700 min-w-[300px]">
                                    {t("teacher") || "Professeur"}
                                </th>
                                <th className="p-4 text-center font-semibold text-gray-700">
                                    {t("action") || "Action"}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEtudiants.map((etudiant) => {
                                const currentTeacher = getCurrentTeacher(etudiant);
                                const hasTeacher = !!currentTeacher;

                                return (
                                    <tr
                                        key={etudiant.id}
                                        className="border-t hover:bg-blue-50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">
                                                {etudiant.nom} {etudiant.prenom}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {etudiant.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {currentTeacher ? (
                                                <div className="flex items-center gap-2">
                                                    <UserCog className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-700">
                                                            {currentTeacher}
                                                        </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">
                                                        {t("noTeacher") || "Aucun professeur"}
                                                    </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                                                    {etudiant.progEtude || "N/A"}
                                                </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-2">
                                                {/* Teacher search for this row */}
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder={t("searchTeacher") || "Rechercher un professeur..."}
                                                        value={teacherSearch[etudiant.id!] || ""}
                                                        onChange={(e) =>
                                                            setTeacherSearch({
                                                                ...teacherSearch,
                                                                [etudiant.id!]: e.target.value
                                                            })
                                                        }
                                                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={assigning === etudiant.id}
                                                    />
                                                </div>

                                                {/* Teacher select dropdown */}
                                                <select
                                                    value={selectedProf[etudiant.id!] || ""}
                                                    onChange={(e) =>
                                                        setSelectedProf({
                                                            ...selectedProf,
                                                            [etudiant.id!]: parseInt(e.target.value)
                                                        })
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={assigning === etudiant.id}
                                                >
                                                    <option value="">
                                                        {t("selectOption") || "-- Sélectionner --"}
                                                    </option>
                                                    {getFilteredProfesseurs(etudiant.id!).map((prof) => (
                                                        <option key={prof.id} value={prof.id}>
                                                            {prof.nom} {prof.prenom} ({prof.email})
                                                        </option>
                                                    ))}
                                                </select>

                                                {teacherSearch[etudiant.id!] && getFilteredProfesseurs(etudiant.id!).length === 0 && (
                                                    <p className="text-xs text-red-500">
                                                        {t("noTeacherFound") || "Aucun professeur trouvé"}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleAssign(etudiant.id!)}
                                                disabled={assigning === etudiant.id}
                                                className={`${
                                                    hasTeacher
                                                        ? 'bg-orange-600 hover:bg-orange-700'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                } disabled:bg-gray-400 text-white px-4 py-2 rounded-xl shadow transition-all duration-200 flex items-center gap-2 mx-auto`}
                                            >
                                                {assigning === etudiant.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        {t("assigning") || "Assignation..."}
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck className="w-4 h-4" />
                                                        {hasTeacher
                                                            ? (t("changeTeacher") || "Changer")
                                                            : (t("assign") || "Assigner")}
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}