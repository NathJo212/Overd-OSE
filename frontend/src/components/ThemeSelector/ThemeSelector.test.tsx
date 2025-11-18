import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ThemeSelector from '../ThemeSelector';

// Mock i18n : renvoie la clé pour faciliter les assertions
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));


function createMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners: Array<(e: { matches: boolean }) => void> = [];

  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listeners.push(cb);
    },
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    addListener: (cb: (e: { matches: boolean }) => void) => {
      listeners.push(cb);
    },
    removeListener: (cb: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    // helper to simulate a change
    simulateChange(newMatches: boolean) {
      matches = newMatches;
      (this as any).matches = newMatches;
      listeners.forEach(cb => cb({ matches: newMatches }));
    }
  } as unknown as MediaQueryList & { simulateChange: (v: boolean) => void };
}

let mqlMock: any;

beforeEach(() => {
  // setup similaire au DashboardProfesseur tests : nettoyer localStorage et dataset
  localStorage.clear();
  document.documentElement.dataset.theme = '';
  mqlMock = createMatchMedia(false);
  vi.stubGlobal('matchMedia', () => mqlMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemeSelector - comportements principaux', () => {
  it('par défaut utilise le système et reflète prefers-color-scheme (light)', async () => {
    render(<ThemeSelector />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    const lightBtn = screen.getByLabelText('Light theme');
    const darkBtn = screen.getByLabelText('Dark theme');

    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
    expect(darkBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('cliquer sur dark applique le thème et sauvegarde la préférence', async () => {
    render(<ThemeSelector />);

    const darkBtn = screen.getByLabelText('Dark theme');
    fireEvent.click(darkBtn);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByLabelText('Dark theme')).toHaveAttribute('aria-pressed', 'true');
  });

  it('cliquer sur light applique le thème et sauvegarde la préférence', async () => {
    render(<ThemeSelector />);

    const lightBtn = screen.getByLabelText('Light theme');
    fireEvent.click(lightBtn);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    expect(localStorage.getItem('theme')).toBe('light');
    expect(screen.getByLabelText('Light theme')).toHaveAttribute('aria-pressed', 'true');
  });

  it('respecte la préférence stockée au démarrage', async () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeSelector />);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(screen.getByLabelText('Dark theme')).toHaveAttribute('aria-pressed', 'true');
  });

  it('met à jour quand la préférence système change si le choix est system', async () => {
    // système initial = light
    render(<ThemeSelector />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));

    // simuler changement système vers dark
    mqlMock.simulateChange(true);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(screen.getByLabelText('Dark theme')).toHaveAttribute('aria-pressed', 'true');
  });
});
