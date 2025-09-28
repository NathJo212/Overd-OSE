// src/components/NavBar.tsx - Version mise à jour
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import utilisateurService from "../services/UtilisateurService";
import LanguageSelector from './LanguageSelector';

const NavBar = () => {
    const navigate = useNavigate();
    const isConnected = !!sessionStorage.getItem("authToken");

    const handleLogout = async () => {
        await utilisateurService.deconnexion();
        navigate("/login");
    };

    return (
        <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
            <span className="font-bold text-lg text-gray-800">Overd-OSE</span>

            <div className="flex items-center gap-4">
                {/* Sélecteur de langue toujours visible */}
                <LanguageSelector />

                {/* Bouton de déconnexion si connecté */}
                {isConnected && (
                    <button
                        onClick={handleLogout}
                        className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                    </button>
                )}
            </div>
        </nav>
    );
};

export default NavBar;