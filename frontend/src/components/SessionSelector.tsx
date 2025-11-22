import { useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../context/SessionContext';

const SessionSelector = () => {
    const { t } = useTranslation(['common']);
    const { 
        selectedSession, 
        setSelectedSession, 
        availableSessions, 
        setAvailableSessions,
        isLoading,
        setIsLoading 
    } = useSession();
    const token = sessionStorage.getItem("authToken") || "";

    useEffect(() => {
        loadAvailableSessions();
    }, []);

    const loadAvailableSessions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:8080/OSEacademicSession/sessions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load academic sessions');
            }

            const sessions = await response.json();
            setAvailableSessions(sessions);

            // Si aucune session n'est sélectionnée, sélectionner la session courante par défaut
            if (!selectedSession) {
                const currentSession = sessions.find((s: any) => s.current);
                if (currentSession) {
                    setSelectedSession(currentSession.sessionKey);
                }
            }
        } catch (error) {
            console.error('Error loading academic sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSessionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedSession(value === '' ? null : value);
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{t('common:loading')}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <select
                value={selectedSession || ''}
                onChange={handleSessionChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:border-gray-400 transition-colors"
            >
                {availableSessions.map((session) => (
                    <option key={session.sessionKey} value={session.sessionKey}>
                        {session.displayName} {session.current ? `(${t('common:current')})` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SessionSelector;


