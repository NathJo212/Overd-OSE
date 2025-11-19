import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import utilisateurService from "../services/UtilisateurService";
import LanguageSelector from './LanguageSelector';
import NotificationEtudiant from './NotificationEtudiant.tsx';
import { useTranslation } from "react-i18next";
import NotificationEmployeur from "./NotificationEmployeur.tsx";

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

                    // Fonction pour formater le nom du rôle en français
                    const getRoleLabel = (role: string) => {
                        switch (role) {
                            case 'ETUDIANT': return 'Étudiant';
                            case 'PROFESSEUR': return 'Professeur';
                            case 'GESTIONNAIRE': return 'Gestionnaire';
                            case 'EMPLOYEUR': return 'Employeur';
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
    }, [isConnected, role]);

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
                        <div className="hidden md:flex items-center space-x-2">
                            <LanguageSelector />

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
                                    <span className="font-medium text-sm">{t('navbar:logout')}</span>
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

                            <div className="flex justify-center">
                                <LanguageSelector />
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
                                    className="cursor-pointer w-full bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-4 py-3 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border border-red-400/30 hover:border-red-400/50"
                                >
                                    <LogOut className="w-5 h-5" />
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