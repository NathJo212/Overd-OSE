import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import utilisateurService from "../services/UtilisateurService";
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';
import NotificationEtudiant from './NotificationEtudiant.tsx';
import { useTranslation } from "react-i18next";
import NotificationEmployeur from "./NotificationEmployeur.tsx";
import SearchBar from "./SearchBar/SearchBar.tsx";
import { useYear } from "./YearContext/YearContext.tsx";

const NavBar = () => {
    const navigate = useNavigate();
    const isConnected = !!sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userType");
    const { t } = useTranslation(['navbar']);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userFullName, setUserFullName] = useState('');
    const { selectedYear, setSelectedYear } = useYear();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    // Afficher le sélecteur d'année seulement pour GESTIONNAIRE et EMPLOYEUR
    const showYearSelector = role === 'GESTIONNAIRE' || role === 'EMPLOYEUR';

    useEffect(() => {
        if (isConnected && role) {
            try {
                const userData = sessionStorage.getItem('userData');
                if (userData) {
                    const user = JSON.parse(userData);

                    const getRoleLabel = (role: string) => {
                        switch (role) {
                            case 'ETUDIANT': return t('navbar:roles.ETUDIANT');
                            case 'PROFESSEUR': return t('navbar:roles.PROFESSEUR');
                            case 'GESTIONNAIRE': return t('navbar:roles.GESTIONNAIRE');
                            case 'EMPLOYEUR': return t('navbar:roles.EMPLOYEUR');
                            default: return role;
                        }
                    };

                    if (role === 'EMPLOYEUR') {
                        setUserFullName(getRoleLabel(role));
                    } else {
                        const prenom = user.prenom || '';
                        const nom = user.nom || '';
                        const fullName = `${prenom} ${nom}`.trim();
                        if (fullName) {
                            setUserFullName(`${fullName} - ${getRoleLabel(role)}`);
                        } else {
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
                        {/* Logo and Year Selector */}
                        <div className="flex items-center gap-3">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-md">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">📚</span>
                                </div>
                                <span className="font-bold text-lg text-white tracking-tight hidden sm:inline">
                                    Overd-OSE
                                </span>
                            </div>

                            {/* Year Selector - Only for GESTIONNAIRE and EMPLOYEUR */}
                            {showYearSelector && (
                                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-slate-600">
                                    <Calendar className="w-3.5 h-3.5 text-white/80" />
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-transparent text-white font-medium text-xs border-none outline-none cursor-pointer pr-1"
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year} className="bg-blue-700 dark:bg-slate-800">
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* User name display - Desktop (only on xl screens) */}
                            {isConnected && userFullName && (
                                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-slate-600">
                                    <User className="w-3.5 h-3.5 text-white/80" />
                                    <span className="text-white/90 font-medium text-xs max-w-[180px] truncate">
                                        {userFullName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Desktop menu - Compact */}
                        <div className="flex">
                            <div className="hidden md:flex items-center gap-1.5">
                                {/* Compact SearchBar */}
                                <div className="w-48 lg:w-56">
                                    <SearchBar />
                                </div>

                                <LanguageSelector />
                                <ThemeSelector />

                                {isConnected && (
                                    <button
                                        onClick={handleLogout}
                                        className="cursor-pointer bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-300 border border-red-400/30 hover:border-red-400/50 shadow-sm hover:shadow-red-500/20"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="font-medium text-sm hidden lg:inline">{t('navbar:logout')}</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isConnected && role === 'ETUDIANT' && (
                                    <NotificationEtudiant />
                                )}

                                {isConnected && role === 'EMPLOYEUR' && (
                                    <NotificationEmployeur />
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
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-blue-700 dark:bg-slate-800 border-t border-white/10 dark:border-slate-700">
                        <div className="px-4 py-4 space-y-3">

                            {/* Year Selector - Mobile (for GESTIONNAIRE and EMPLOYEUR) */}
                            {showYearSelector && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-slate-600 mb-2">
                                    <Calendar className="w-4 h-4 text-white/80" />
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-transparent text-white font-medium text-sm border-none outline-none cursor-pointer flex-1"
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year} className="bg-blue-700 dark:bg-slate-800">
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* User name display - Mobile */}
                            {isConnected && userFullName && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-white/10 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/20 dark:border-slate-600 mb-2">
                                    <User className="w-4 h-4 text-white/80" />
                                    <span className="text-white/90 font-medium text-sm">{userFullName}</span>
                                </div>
                            )}


                            {/* SearchBar - Mobile */}
                            <div className="mb-3">
                                <SearchBar />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <LanguageSelector />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <ThemeSelector />
                            </div>

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