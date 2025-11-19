import React, { useState, useRef, useEffect } from 'react';
import { gestionnaireService } from '../../services/GestionnaireService.ts';
import { useTranslation } from 'react-i18next';

const ChatBot: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const { t, i18n } = useTranslation(['chatbot']);
    const [messages, setMessages] = useState([
        { from: 'bot', text: t('welcome') },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const toggle = () => setOpen((v) => !v);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setMessages((m) => [...m, { from: 'user', text }]);
        setInput('');
        setLoading(true);
        setError(null);
        try {
            const jwt = sessionStorage.getItem('authToken');
            if (!jwt) throw new Error('Token JWT manquant. Veuillez vous reconnecter.');
            const reply = await gestionnaireService.chatClient(text, jwt);
            setMessages((m) => [
                ...m,
                { from: 'bot', text: reply },
            ]);
        } catch (e: any) {
            setMessages((m) => [
                ...m,
                { from: 'bot', text: `Erreur: ${e.message}` },
            ]);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') sendMessage();
    };

    useEffect(() => {
        const handleLanguageChange = () => {
            setMessages((msgs) => {
                if (msgs.length > 0 && msgs[0].from === 'bot') {
                    return [{ from: 'bot', text: t('welcome') }, ...msgs.slice(1)];
                }
                return msgs;
            });
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [t, i18n]);

    return (
        <div>
            {/* Bouton */}
            <button
                aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
                onClick={toggle}
                className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center z-50 hover:bg-blue-700 transition-colors dark:bg-blue-600"
            >
                {open ? <span className="text-2xl">×</span> : <span className="text-2xl">💬</span>}
            </button>

            {/* Chat */}
            {open && (
                <div
                    className="fixed right-6 bottom-28 w-80 max-h-[420px] h-[420px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 font-sans border border-white/10 dark:border-slate-700"
                >
                    {/* Use translated header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-white/10">
                        <strong className="text-white text-base">{t('header')}</strong>
                    </div>

                    <div className="px-3 py-2 flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex mb-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[78%] px-3 py-2 rounded-xl text-sm ${{}}
                    ${
                                        m.from === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-slate-100'
                                    }`}
                                >
                                    {/* Découpe les gros blocks de texte en paragraphes */}
                                    {m.text.split(/\n\n|\r\n\r\n|\r\r/).map((block, idx) => (
                                        <p key={idx} style={{ marginBottom: 8 }}>{block}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {/* Indicateur d'attente */}
                        {loading && (
                            <div className="flex justify-start mb-2">
                                <div className="max-w-[78%] px-3 py-2 rounded-xl text-sm bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-slate-100 animate-pulse">
                                    <span className="inline-block align-middle mr-2">⏳</span>{t('loading')}
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="px-3 py-2 border-t border-gray-200 dark:border-slate-700 flex gap-2 bg-white dark:bg-slate-800">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={t('inputPlaceholder')}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? '...' : t('send')}
                        </button>
                        {error && (
                            <div className="text-red-500 text-xs mt-2">{t('error', { message: error })}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;


