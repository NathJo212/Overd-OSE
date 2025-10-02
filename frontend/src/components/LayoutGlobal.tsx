// src/components/Layout.tsx - Version avec sélecteur flottant
import { Outlet, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';

const LayoutGlobal = () => {
    const location = useLocation();

    // Pages qui N'ONT PAS de NavBar
    const pagesWithoutNavBar = [
        '/',
        '/inscription-employeur',
        '/inscription-etudiant',
        '/login'
    ];

    const showFloatingLanguageSelector = pagesWithoutNavBar.includes(location.pathname);

    return (
        <div className="min-h-screen">
            {/* Sélecteur de langue flottant pour pages sans NavBar */}
            {showFloatingLanguageSelector && (
                <div className="fixed top-4 right-4 z-50">
                    <LanguageSelector />
                </div>
            )}

            {/* Contenu de la page */}
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default LayoutGlobal;