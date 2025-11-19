import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ChatBot from './ChatBot.tsx';

// Mock de react-i18next
vi.mock('react-i18next', () => {
  const listeners: Record<string, Function[]> = {};
  const i18n = {
    on: (event: string, cb: Function) => {
      (listeners[event] ||= []).push(cb);
    },
    off: (event: string, cb: Function) => {
      listeners[event] = (listeners[event] || []).filter((f) => f !== cb);
    },
  } as any;
  // expose a trigger on globalThis so tests can call it without hoisting issues
  (globalThis as any).__triggerLanguageChange = (lang?: string) => {
    (listeners['languageChanged'] || []).forEach((cb) => cb(lang));
  };
  return {
    useTranslation: () => ({ t: (k: string) => k, i18n }),
  };
});

// Importer le service et espionner son appel
import { gestionnaireService } from '../../services/GestionnaireService.ts';

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

describe('ChatBot component', () => {
  it('ouvre et ferme le chat via le bouton', async () => {
    render(<ChatBot />);
    const openBtn = screen.getByRole('button');
    // initialement fermé -> header non présent
    expect(screen.queryByText('header')).toBeNull();
    // ouvrir
    fireEvent.click(openBtn);
    expect(screen.getByText('header')).toBeInTheDocument();
    // fermer
    fireEvent.click(openBtn);
    await waitFor(() => expect(screen.queryByText('header')).toBeNull());
  });

  it('affiche le message de bienvenue initial', () => {
    render(<ChatBot />);
    // ouvrir le chat
    const openBtn = screen.getByRole('button');
    fireEvent.click(openBtn);
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });

  it('envoie un message et affiche la réponse du service', async () => {
    // préparer le mock du service
    (gestionnaireService as any).chatClient = vi.fn().mockResolvedValue('Réponse du bot');
    sessionStorage.setItem('authToken', 'fake-jwt');

    render(<ChatBot />);
    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByPlaceholderText('inputPlaceholder') as HTMLInputElement;
    const sendBtn = screen.getByText('send');

    fireEvent.change(input, { target: { value: 'Bonjour' } });
    fireEvent.click(sendBtn);

    // loading apparait
    expect(screen.getByText('loading')).toBeInTheDocument();

    await waitFor(() => expect((gestionnaireService as any).chatClient).toHaveBeenCalledWith('Bonjour', 'fake-jwt'));
    // la réponse du bot est affichée
    expect(screen.getByText('Réponse du bot')).toBeInTheDocument();
  });

  it('gère l’absence de token JWT en affichant une erreur', async () => {
    // ne pas mettre de token
    (gestionnaireService as any).chatClient = vi.fn();

    render(<ChatBot />);
    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByPlaceholderText('inputPlaceholder') as HTMLInputElement;
    const sendBtn = screen.getByText('send');

    fireEvent.change(input, { target: { value: 'Salut' } });
    fireEvent.click(sendBtn);

    await waitFor(() => expect(screen.getByText((content) => content.includes('Token JWT manquant'))).toBeInTheDocument());
    expect((gestionnaireService as any).chatClient).not.toHaveBeenCalled();
  });

  it('met à jour le message de bienvenue lors d’un changement de langue', async () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('welcome')).toBeInTheDocument();

    // simuler changement de langue via le mock
    (globalThis as any).__triggerLanguageChange?.('fr');

    // le composant remplace le message d'accueil par la clé traduite (ici la même clé)
    await waitFor(() => expect(screen.getByText('welcome')).toBeInTheDocument());
  });
});
