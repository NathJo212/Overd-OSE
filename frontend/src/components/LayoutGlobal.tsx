// src/components/Layout.tsx - Version avec sélecteur flottant
import { Outlet, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import ChatBot from './Chatbot/ChatBot.tsx';

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
    const isGestionnaire = sessionStorage.getItem('authToken') && sessionStorage.getItem('userType') === 'GESTIONNAIRE';

    return (
        <div className="min-h-screen">
            {/* Sélecteur de langue flottant pour pages sans NavBar */}
            {showFloatingLanguageSelector && (
                <div className="fixed top-4 right-4 z-50">
                    <LanguageSelector />
                </div>
            )}

            {/* ChatBot global pour gestionnaire */}
            {isGestionnaire && (
                <div className="fixed right-6 bottom-6 z-50">
                    <ChatBot />
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