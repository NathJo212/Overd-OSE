import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface YearContextType {
    selectedYear: number;
    setSelectedYear: (year: number) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider = ({ children }: { children: ReactNode }) => {
    // Déterminer l'année par défaut
    const getDefaultYear = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11 (0 = janvier, 7 = août)

        // Si nous sommes en août (mois 7) ou après, retourner l'année suivante
        return currentMonth >= 7 ? currentYear + 1 : currentYear;
    };

    const [selectedYear, setSelectedYear] = useState<number>(getDefaultYear());

    return (
        <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
            {children}
        </YearContext.Provider>
    );
};

export const useYear = () => {
    const context = useContext(YearContext);
    if (context === undefined) {
        throw new Error('useYear must be used within a YearProvider');
    }
    return context;
};