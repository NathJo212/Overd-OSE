import { useEffect, useState } from 'react';
import { Bell, X, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import employeurService, { type NotificationDTO } from '../services/EmployeurService';

const NotificationEmployeur = () => {
    const { t } = useTranslation('notifications');
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
    const [loading, setLoading] = useState(false);

    // on stocke UNIQUEMENT les notifications non lues côté front
    const unreadCount = notifications.length;

    const load = async () => {
        setLoading(true);
        try {
            const notes = await employeurService.getNotifications();
            // ne garder que les non lues
            setNotifications((notes || []).filter((n: NotificationDTO) => !n.lu));
        } catch (e: any) {
            console.error('Erreur getNotifications:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(() => load(), 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleOpen = () => {
        setOpen(!open);
        if (!open) load();
    };

    const markAsRead = async (id: number) => {
        // retirer la notification localement (on n'affiche que les non-lues)
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            await employeurService.marquerNotificationLu(id, true);
        } catch (e) {
            console.warn('Erreur markAsRead, rechargement des notifications:', e);
            await load();
        }
    };

    const parseParams = (param?: string | null) => {
        if (!param) return null;
        try {
            const parsed = JSON.parse(param);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
        } catch {
            return param;
        }
        return param;
    };

    const formatMessage = (n: NotificationDTO) => {
        const key = n.messageKey || '';
        const params = parseParams(n.messageParam || undefined);

        if (key) {
            const translation = params && typeof params === 'object'
                ? t(key, { ...(params as Record<string, any>), defaultValue: '' })
                : t(key, { param: params || '', defaultValue: '' });
            if (translation && translation !== '') return translation;
        }

        return '';
    };

    const extractDetails = (n: NotificationDTO) => {
        const params = parseParams(n.messageParam || undefined);
        if (params && typeof params === 'object') {
            return {
                titre: (params.titre as string) || null,
                employeur: (params.employeur as string) || null,
                dateDebut: (params.dateDebut as string) || null,
                dateFin: (params.dateFin as string) || null,
                competences: (params.competences as string) || null,
            };
        }
        return null;
    };

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className="relative p-2 rounded-full text-white hover:bg-white/20 dark:hover:bg-slate-700/40 transition-all"
                aria-label={t('title')}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
                        <h4 className="font-semibold text-gray-800 dark:text-slate-100">{t('title')}</h4>
                        <button onClick={() => setOpen(false)} className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200">
                            <X className="cursor-pointer w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                        {loading && <div className="p-4 text-center text-gray-500 dark:text-slate-400">{t('loading')}</div>}

                        {!loading && unreadCount === 0 && (
                            <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center">{t('noNotifications')}</div>
                        )}

                        {!loading && notifications.map(n => {
                            const details = extractDetails(n);
                            const mainMessage = formatMessage(n);

                            return (
                                <div
                                    key={n.id}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-all bg-blue-50/40 dark:bg-blue-900/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-tight">
                                                {mainMessage}
                                            </div>
                                            {details?.employeur && (
                                                <div className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">{details.employeur}</div>
                                            )}
                                            {details?.competences && (
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    {t('competences')}: {details.competences}
                                                </div>
                                            )}
                                            <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                                                {new Date(n.dateCreation).toLocaleString()}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                            aria-label={t('markAsRead')}
                                            className="p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 transition-all"
                                        >
                                            <EyeOff className="cursor-pointer w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationEmployeur;
