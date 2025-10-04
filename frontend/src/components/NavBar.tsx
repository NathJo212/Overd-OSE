// src/components/NavBar.tsx - Version améliorée
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import utilisateurService from "../services/UtilisateurService";
import LanguageSelector from './LanguageSelector';
import { useTranslation } from "react-i18next";

const NavBar = () => {
    const navigate = useNavigate();
    const isConnected = !!sessionStorage.getItem("authToken");
    const userType = sessionStorage.getItem("userType");
    const { t } = useTranslation(['navbar']);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await utilisateurService.deconnexion();
        navigate("/login");
    };

    const handleNavigateToVisualiserOffres = () => {
        navigate("/visualiser-offres");
        setMobileMenuOpen(false);
    };

    return (
        <div>
        <nav className="bg-gradient-to-r m-4 rounded-2xl from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo et titre */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-blue-600 font-bold text-xl">📚</span>
                        </div>
                        <span className="font-bold text-xl text-white tracking-tight">
                            Overd-OSE
                        </span>
                    </div>

                    {/* Desktop menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isConnected && userType === "GESTIONNAIRE" && (
                            <button
                                onClick={handleNavigateToVisualiserOffres}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-white/20 hover:border-white/30 shadow-sm"
                            >
                                <span className="font-medium">Visualiser Offres</span>
                            </button>
                        )}

                        <LanguageSelector />

                        {isConnected && (
                            <button
                                onClick={handleLogout}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-white/20 hover:border-white/30 shadow-sm"
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
                            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
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
                        {isConnected && userType === "GESTIONNAIRE" && (
                            <button
                                onClick={handleNavigateToVisualiserOffres}
                                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 border border-white/20"
                            >
                                <span className="font-medium">Visualiser Offres</span>
                            </button>
                        )}

                        <div className="flex justify-center">
                            <LanguageSelector />
                        </div>

                        {isConnected && (
                            <button
                                onClick={handleLogout}
                                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 border border-white/20"
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