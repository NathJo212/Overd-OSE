import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import utilisateurService from "../services/UtilisateurService";

const NavBar = () => {
    const navigate = useNavigate();
    const isConnected = !!sessionStorage.getItem("authToken");

    const handleLogout = async () => {
        await utilisateurService.deconnexion();
        navigate("/login");
    };

    return (
        <nav className="p-4 flex justify-between items-center">
            <span className="font-bold text-lg">Overd-OSE</span>
            {isConnected && (
                <button
                    onClick={handleLogout}
                    className="bg-white px-4 py-2 rounded hover:bg-blue-100 flex items-center gap-2"
                >
                    <LogOut className="w-5 h-5 text-red-600" />
                    Déconnexion
                </button>
            )}
        </nav>
    );
};

export default NavBar;
