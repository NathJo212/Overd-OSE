import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AcademicSessionDTO {
    sessionKey: string;        // Ex: "HIVER_2025"
    sessionName: string;       // Ex: "Hiver"
    year: number;              // Ex: 2025
    displayName: string;       // Ex: "Hiver 2025"
    current: boolean;          // Si c'est la session courante
}

interface SessionContextType {
    selectedSession: string | null;
    setSelectedSession: (session: string | null) => void;
    availableSessions: AcademicSessionDTO[];
    setAvailableSessions: (sessions: AcademicSessionDTO[]) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedSession, setSelectedSessionState] = useState<string | null>(null);
    const [availableSessions, setAvailableSessions] = useState<AcademicSessionDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Charger la session depuis sessionStorage au montage
    useEffect(() => {
        const savedSession = sessionStorage.getItem('selectedAcademicSession');
        if (savedSession) {
            setSelectedSessionState(savedSession);
        }
    }, []);

    // Sauvegarder la session dans sessionStorage quand elle change
    const setSelectedSession = (session: string | null) => {
        setSelectedSessionState(session);
        if (session) {
            sessionStorage.setItem('selectedAcademicSession', session);
        } else {
            sessionStorage.removeItem('selectedAcademicSession');
        }
    };

    return (
        <SessionContext.Provider
            value={{
                selectedSession,
                setSelectedSession,
                availableSessions,
                setAvailableSessions,
                isLoading,
                setIsLoading,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};


