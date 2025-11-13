import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2, User, GraduationCap, UserCog, Briefcase, Users, Calendar } from "lucide-react";
import NavBar from "./NavBar";
import searchService from "../services/UtilisateurService.ts";

interface ProfileData {
    id: number;
    nom?: string;
    prenom?: string;
    email: string;
    telephone?: string;
    nomEntreprise?: string;
    contact?: string;
    progEtude?: string;
    session?: string;
    annee?: string;
    etudiantList?: any[];
}

const UserProfile = () => {
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!type || !id) return;

            setLoading(true);
            setError(null);

            try {
                const userId = parseInt(id);
                const data = await searchService.getUserProfile(type, userId);
                setProfile(data);
            } catch (err) {
                console.error("Error loading profile:", err);
                setError("Impossible de charger le profil");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [type, id]);

    const getIcon = () => {
        switch (type?.toUpperCase()) {
            case "ETUDIANT":
                return <Users className="w-8 h-8 text-indigo-600" />;
            case "EMPLOYEUR":
                return <Building2 className="w-8 h-8 text-blue-600" />;
            case "PROFESSEUR":
                return <GraduationCap className="w-8 h-8 text-purple-600" />;
            case "GESTIONNAIRE":
                return <UserCog className="w-8 h-8 text-green-600" />;
            default:
                return <User className="w-8 h-8 text-gray-600" />;
        }
    };

    const getBgColor = () => {
        switch (type?.toUpperCase()) {
            case "ETUDIANT":
                return "bg-indigo-50";
            case "EMPLOYEUR":
                return "bg-blue-50";
            case "PROFESSEUR":
                return "bg-purple-50";
            case "GESTIONNAIRE":
                return "bg-green-50";
            default:
                return "bg-gray-50";
        }
    };

    const getDisplayName = () => {
        if (!profile) return "";
        if (type?.toUpperCase() === "EMPLOYEUR") {
            return profile.nomEntreprise || profile.contact || "Employeur";
        }
        return `${profile.prenom || ""} ${profile.nom || ""}`.trim() || "Utilisateur";
    };

    const getDisplayType = () => {
        switch (type?.toUpperCase()) {
            case "ETUDIANT": return "Étudiant";
            case "EMPLOYEUR": return "Employeur";
            case "PROFESSEUR": return "Professeur";
            case "GESTIONNAIRE": return "Gestionnaire";
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <NavBar />
                <div className="container mx-auto px-4 py-8 max-w-5xl">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-4">Chargement du profil...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <NavBar />
                <div className="container mx-auto px-4 py-8 max-w-5xl">
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <p className="text-red-600">{error || "Profil non trouvé"}</p>
                        <button
                            onClick={() => navigate("/search")}
                            className="cursor-pointer mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                        >
                            Retour à la recherche
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <button
                    onClick={() => navigate(-1)}
                    className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg mb-6">
                    <div className={`${getBgColor()} p-8`}>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white rounded-2xl shadow-md">
                                {getIcon()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {getDisplayName()}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {getDisplayType()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            Informations de contact
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-gray-900 font-medium truncate">{profile.email}</p>
                                </div>
                            </div>

                            {profile.telephone && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Téléphone</p>
                                        <p className="text-gray-900 font-medium">{profile.telephone}</p>
                                    </div>
                                </div>
                            )}

                            {type?.toUpperCase() === "EMPLOYEUR" && profile.contact && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Personne contact</p>
                                        <p className="text-gray-900 font-medium">{profile.contact}</p>
                                    </div>
                                </div>
                            )}

                            {type?.toUpperCase() === "ETUDIANT" && profile.progEtude && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <Briefcase className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Programme d'études</p>
                                        <p className="text-gray-900 font-medium">{profile.progEtude}</p>
                                    </div>
                                </div>
                            )}

                            {type?.toUpperCase() === "ETUDIANT" && profile.session && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500">Session</p>
                                        <p className="text-gray-900 font-medium">{profile.session} {profile.annee}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Sections for Professeur */}
                {type?.toUpperCase() === "PROFESSEUR" && profile.etudiantList && profile.etudiantList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Users className="w-6 h-6 text-purple-600" />
                            Étudiants supervisés ({profile.etudiantList.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.etudiantList.map((etudiant: any) => (
                                <div key={etudiant.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <p className="font-medium text-gray-900">
                                        {etudiant.prenom} {etudiant.nom}
                                    </p>
                                    <p className="text-sm text-gray-600">{etudiant.email}</p>
                                    {etudiant.progEtude && (
                                        <p className="text-sm text-gray-500 mt-1">{etudiant.progEtude}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;