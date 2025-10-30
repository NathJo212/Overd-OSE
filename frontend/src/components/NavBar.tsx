// src/components/NavBar.tsx - Version avec liens pour Gestionnaire incluant Ententes de stage
import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, Menu, X, FileText, Briefcase, User, FileSignature } from "lucide-react";
import { useState, useEffect } from "react";
import utilisateurService from "../services/UtilisateurService";
import LanguageSelector from './LanguageSelector';
import { useTranslation } from "react-i18next";

const NavBar = () => {
    const navigate = useNavigate();
    const isConnected = !!sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("userType");
    const { t } = useTranslation(['navbar']);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userFullName, setUserFullName] = useState('');

    useEffect(() => {
        if (isConnected) {
            try {
                const userData = sessionStorage.getItem('userData');
                if (userData) {
                    const user = JSON.parse(userData);
                    const prenom = user.prenom || '';
                    const nom = user.nom || '';
                    const fullName = `${prenom} ${nom}`.trim();
                    if (fullName) {
                        setUserFullName(fullName);
                    }
                }
            } catch (e) {
                console.warn('Unable to parse userData', e);
            }
        }
    }, [isConnected]);

    const handleLogout = async () => {
        await utilisateurService.deconnexion();
        navigate("/login");
    };

    return (
        <div>
            <nav className="bg-gradient-to-r m-4 rounded-2xl from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo, titre et nom utilisateur */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                                    <span className="text-blue-600 font-bold text-xl">📚</span>
                                </div>
                                <span className="font-bold text-xl text-white tracking-tight">
                                    Overd-OSE
                                </span>
                            </div>

                            {/* User name display - Desktop */}
                            {isConnected && userFullName && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                    <User className="w-4 h-4 text-white/80" />
                                    <span className="text-white/90 font-medium text-sm">
                                        {userFullName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Desktop menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {/* Liens pour GESTIONNAIRE */}
                            {isConnected && role === "GESTIONNAIRE" && (
                                <>
                                    <NavLink
                                        to="/dashboard-gestionnaire"
                                        className={({ isActive }) =>
                                            `px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                                                isActive
                                                    ? "bg-white text-blue-600 shadow-md"
                                                    : "text-white hover:bg-white/10 border border-white/20"
                                            }`
                                        }
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        {t('navbar:internshipOffers')}
                                    </NavLink>
                                    <NavLink
                                        to="/cvs-etudiants-gestionnaire"
                                        className={({ isActive }) =>
                                            `px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                                                isActive
                                                    ? "bg-white text-blue-600 shadow-md"
                                                    : "text-white hover:bg-white/10 border border-white/20"
                                            }`
                                        }
                                    >
                                        <FileText className="w-4 h-4" />
                                        {t('navbar:studentResumes')}
                                    </NavLink>
                                    <NavLink
                                        to="/ententes-stage-gestionnaire"
                                        className={({ isActive }) =>
                                            `px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                                                isActive
                                                    ? "bg-white text-blue-600 shadow-md"
                                                    : "text-white hover:bg-white/10 border border-white/20"
                                            }`
                                        }
                                    >
                                        <FileSignature className="w-4 h-4" />
                                        {t('navbar:internshipAgreements')}
                                    </NavLink>
                                </>
                            )}

                            <LanguageSelector />

                            {isConnected && (
                                <button
                                    onClick={handleLogout}
                                    className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-white/20 hover:border-white/30 shadow-sm"
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
                                className="cursor-pointer text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
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
                    <div className="md:hidden bg-blue-700 border-t border-white/10">
                        <div className="px-4 py-4 space-y-3">
                            {/* User name display - Mobile */}
                            {isConnected && userFullName && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mb-2">
                                    <User className="w-4 h-4 text-white/80" />
                                    <span className="text-white/90 font-medium text-sm">
                                        {userFullName}
                                    </span>
                                </div>
                            )}

                            {/* Liens pour GESTIONNAIRE (Mobile) */}
                            {isConnected && role === "GESTIONNAIRE" && (
                                <>
                                    <NavLink
                                        to="/dashboard-gestionnaire"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                                                isActive
                                                    ? "bg-white text-blue-600"
                                                    : "text-white bg-white/10 hover:bg-white/20"
                                            }`
                                        }
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        {t('navbar:internshipOffers')}
                                    </NavLink>
                                    <NavLink
                                        to="/cvs-etudiants-gestionnaire"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                                                isActive
                                                    ? "bg-white text-blue-600"
                                                    : "text-white bg-white/10 hover:bg-white/20"
                                            }`
                                        }
                                    >
                                        <FileText className="w-4 h-4" />
                                        {t('navbar:studentResumes')}
                                    </NavLink>
                                    <NavLink
                                        to="/ententes-stage-gestionnaire"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                                                isActive
                                                    ? "bg-white text-blue-600"
                                                    : "text-white bg-white/10 hover:bg-white/20"
                                            }`
                                        }
                                    >
                                        <FileSignature className="w-4 h-4" />
                                        {t('navbar:internshipAgreements')}
                                    </NavLink>
                                </>
                            )}

                            <div className="flex justify-center">
                                <LanguageSelector />
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