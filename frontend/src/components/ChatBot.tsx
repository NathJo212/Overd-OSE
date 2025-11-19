import React, { useState, useRef, useEffect } from 'react';

const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Bonjour ! Posez-moi une question.' },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const toggle = () => setOpen((v) => !v);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: `Réponse automatique : J'ai bien reçu votre question "${text}".` },
      ]);
    }, 700);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div>
      {/* Bouton */}
      <button
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        onClick={toggle}
        className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center z-50 hover:bg-blue-700 transition-colors"
      >
        {open ? <span className="text-2xl">×</span> : <span className="text-2xl">💬</span>}
      </button>

      {/* Chat */}
      {open && (
        <div
          className="fixed right-6 bottom-28 w-80 max-h-[420px] h-[420px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 font-sans border border-white/10"
        >
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-white/10">
            <strong className="text-white text-base">Assistant IA</strong>
            <div className="text-white/80 text-xs mt-1">
              Ceci est une intelligence artificielle servant d'assistant, vous pouvez luis poser des questions.
            </div>
          </div>

          <div className="px-3 py-2 flex-1 overflow-y-auto bg-white">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex mb-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-xl text-sm ${
                    m.from === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="px-3 py-2 border-t border-gray-200 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Écrire un message..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
