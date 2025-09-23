import {useEffect} from "react";
import { useNavigate } from "react-router-dom";

const DashBoardEmployeur = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const role = sessionStorage.getItem("userType");
        if (role !== "ETUDIANT") {
            navigate("/login");
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-6">Tableau de bord Etudiant</h1>
            </div>
        </div>
    );
};

export default DashBoardEmployeur;
