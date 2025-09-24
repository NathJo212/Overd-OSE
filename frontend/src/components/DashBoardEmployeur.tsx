import {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import {NavLink} from "react-router";


const DashBoardEmployeur = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "EMPLOYEUR") {
            navigate("/login");
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-6">Tableau de bord Employeur</h1>
                <NavLink
                    to="/offre-stage"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
                >
                    Créer une offre de stage
                </NavLink>
            </div>
        </div>
    );
};

export default DashBoardEmployeur;
