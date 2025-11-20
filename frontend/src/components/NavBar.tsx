import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, Menu, X, User, Briefcase, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import utilisateurService from "../services/UtilisateurService";
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';
import NotificationEtudiant from './NotificationEtudiant.tsx';
import { useTranslation } from "react-i18next";
import NotificationEmployeur from "./NotificationEmployeur.tsx";
import SearchBar from "./SearchBar/SearchBar.tsx";

const NavBar = () => {
    const navigate = useNavigate();
    const isConnected = !!sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userType");
    const { t } = useTranslation(['navbar']);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userFullName, setUserFullName] = useState('');

    useEffect(() => {
        if (isConnected && role) {
            try {
                const userData = sessionStorage.getItem('userData');
                if (userData) {
                    const user = JSON.parse(userData);

                    // Fonction pour formater le nom du rôle en utilisant i18n
                    const getRoleLabel = (role: string) => {
                        switch (role) {
                            case 'ETUDIANT': return t('navbar:roles.ETUDIANT');
                            case 'PROFESSEUR': return t('navbar:roles.PROFESSEUR');
                            case 'GESTIONNAIRE': return t('navbar:roles.GESTIONNAIRE');
                            case 'EMPLOYEUR': return t('navbar:roles.EMPLOYEUR');
                            default: return role;
                        }
                    };

                    // Pour les employeurs, afficher seulement le rôle
                    if (role === 'EMPLOYEUR') {
                        setUserFullName(getRoleLabel(role));
                    } else {
                        // Pour les autres rôles (Étudiant, Professeur, Gestionnaire), afficher "Prénom Nom - Rôle"
                        const prenom = user.prenom || '';
                        const nom = user.nom || '';
                        const fullName = `${prenom} ${nom}`.trim();
                        if (fullName) {
                            setUserFullName(`${fullName} - ${getRoleLabel(role)}`);
                        } else {
                            // Fallback si pas de nom/prénom
                            setUserFullName(getRoleLabel(role));
                        }
                    }
                }
            } catch (e) {
                console.warn('Unable to parse userData', e);
            }
        }
    }, [isConnected, role, t]);

    const handleLogout = async () => {
        await utilisateurService.deconnexion();
        navigate("/login");
    };

    return (
        <div>
            <nav className="bg-gradient-to-r m-4 rounded-2xl from-blue-600 to-blue-700 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-blue-500/20 dark:shadow-slate-900/40 backdrop-blur-md border border-white/10 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo, titre et nom utilisateur */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-md">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">📚</span>
                                </div>
                                <span className="font-bold text-xl text-white tracking-tight">
                                    Overd-OSE
                                </span>
                            </div>

                            {/* User name display - Desktop */}
                            {isConnected && userFullName && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-slate-600">
                                    <User className="w-4 h-4 text-white/80" />
                                    <span className="text-white/90 font-medium text-sm">
                                        {userFullName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Desktop menu */}
                        <div className="hidden md:flex items-center space-x-2">
                            <SearchBar />
                            <LanguageSelector />
                            <ThemeSelector />

                            {isConnected && role === 'ETUDIANT' && (
                                <NotificationEtudiant />
                            )}

                            {isConnected && role === 'EMPLOYEUR' && (
                                <NotificationEmployeur />
                            )}

                            {isConnected && (
                                <button
                                    onClick={handleLogout}
                                    className="cursor-pointer bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-300 border border-red-400/30 hover:border-red-400/50 shadow-sm hover:shadow-red-500/20 ml-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-medium">{t('navbar:logout')}</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="cursor-pointer text-white p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-700 transition-colors"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-blue-700 dark:bg-slate-800 border-t border-white/10 dark:border-slate-700">
                        <div className="px-4 py-4 space-y-3">
                            {/* User name display - Mobile */}
                            {isConnected && userFullName && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-slate-600 mb-2">
                                    <User className="w-4 h-4 text-white/80" />
                                    <span className="text-white/90 font-medium text-sm">{userFullName}</span>
                                </div>
                            )}

                            {/* Liens pour GESTIONNAIRE (Mobile) */}
                            {isConnected && role === 'GESTIONNAIRE' && (
                                <div className="flex flex-col space-y-2">
                                    <NavLink
                                        to="/gestionnaire/tableau-de-bord"
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200
                                            ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'}`
                                        }
                                    >
                                        <Briefcase className="w-5 h-5" />
                                        <span className="font-medium">{t('navbar:dashboard')}</span>
                                    </NavLink>

                                    <NavLink
                                        to="/gestionnaire/utilisateurs"
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200
                                            ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'}`
                                        }
                                    >
                                        <UserCog className="w-5 h-5" />
                                        <span className="font-medium">{t('navbar:users')}</span>
                                    </NavLink>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-2">
                                <LanguageSelector />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <ThemeSelector />
                            </div>

                            {/* Notification bell for mobile students */}
                            {isConnected && role === 'ETUDIANT' && (
                                <div className="px-4">
                                    <NotificationEtudiant />
                                </div>
                            )}

                            {isConnected && (
                                <button
                                    onClick={handleLogout}
                                    className="cursor-pointer w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 border border-white/20"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-medium">{t('navbar:logout')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
};

export default NavBar;
