// src/components/Layout.tsx - Version avec sélecteur flottant
import { Outlet, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';

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
        <div className="min-h-screen bg-white dark:bg-slate-900">
            {/* Sélecteur de langue et thème flottants pour pages sans NavBar */}
            {showFloatingLanguageSelector && (
                <div className="fixed top-4 right-4 z-50 flex gap-2">
                    <LanguageSelector />
                    <ThemeSelector />
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