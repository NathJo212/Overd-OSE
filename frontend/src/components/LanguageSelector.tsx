import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Vérifier que i18n est initialisé
        if (i18n && typeof i18n.changeLanguage === 'function') {
            setIsReady(true);
        }
    }, [i18n]);

    const changeLanguage = (lng: string) => {
        if (i18n && typeof i18n.changeLanguage === 'function') {
            i18n.changeLanguage(lng);
        } else {
            console.error('i18n not properly initialized');
        }
    };

    // Ne pas afficher le sélecteur si i18n n'est pas prêt
    if (!isReady) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-800/80 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <Globe className="w-4 h-4 text-gray-500 dark:text-slate-300" />
            <div className="flex gap-1">
                <button
                    onClick={() => changeLanguage('fr')}
                    className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
                        i18n.language === 'fr'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
                    }`}
                >
                    FR
                </button>
                <button
                    onClick={() => changeLanguage('en')}
                    className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
                        i18n.language === 'en'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
                    }`}
                >
                    EN
                </button>
            </div>
        </div>
    );
};

export default LanguageSelector;