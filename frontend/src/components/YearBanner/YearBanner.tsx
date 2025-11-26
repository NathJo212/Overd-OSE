import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useYear } from "../YearContext/YearContext.tsx";

const YearBanner = () => {
    const { t } = useTranslation(['yearBanner']);
    const { selectedYear } = useYear();

    // Calculer l'année actuelle (année académique)
    const getCurrentYear = (): number => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11 (0 = janvier, 7 = août)

        // Si nous sommes en août (mois 7) ou après, retourner l'année suivante
        return currentMonth >= 7 ? currentYear + 1 : currentYear;
    };

    const currentYear = getCurrentYear();
    const isViewingPastYear = selectedYear < currentYear;

    // Ne rien afficher si on regarde l'année actuelle
    if (!isViewingPastYear) {
        return null;
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-600 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        {t('yearBanner:warning')}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {t('yearBanner:viewingYear', { year: selectedYear })} • {t('yearBanner:currentYear', { year: currentYear })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default YearBanner;