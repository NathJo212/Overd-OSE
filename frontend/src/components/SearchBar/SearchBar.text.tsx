import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchBar from './SearchBar';
import { BrowserRouter } from 'react-router-dom';

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

beforeEach(() => {
    mockNavigate.mockClear();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('SearchBar - comportements principaux', () => {
    it('affiche le champ de recherche avec le placeholder correct', () => {
        wrap(<SearchBar />);
        expect(screen.getByPlaceholderText('placeholder')).toBeInTheDocument();
    });

    it('affiche le bouton de recherche', () => {
        wrap(<SearchBar />);
        const searchButton = screen.getByLabelText('ariaLabel');
        expect(searchButton).toBeInTheDocument();
    });

    it('met à jour la valeur du champ lors de la saisie', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder') as HTMLInputElement;

        fireEvent.change(input, { target: { value: 'test search' } });

        expect(input.value).toBe('test search');
    });

    it('navigue vers la page de recherche lors de la soumission avec un terme', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: 'Jean Dupont' } });
        fireEvent.submit(form);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=Jean%20Dupont');
    });

    it('ne navigue pas si le champ est vide', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: '' } });
        fireEvent.submit(form);

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('ne navigue pas si le champ contient uniquement des espaces', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.submit(form);

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('trim les espaces avant et après le terme de recherche', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: '  test search  ' } });
        fireEvent.submit(form);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20search');
    });

    it('encode correctement les caractères spéciaux dans l\'URL', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: 'Marie-José & Co.' } });
        fireEvent.submit(form);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=Marie-Jos%C3%A9%20%26%20Co.');
    });

    it('soumet la recherche en cliquant sur le bouton', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const searchButton = screen.getByLabelText('ariaLabel');

        fireEvent.change(input, { target: { value: 'search term' } });
        fireEvent.click(searchButton);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=search%20term');
    });

    it('permet la recherche avec des accents français', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: 'François Côté' } });
        fireEvent.submit(form);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=Fran%C3%A7ois%20C%C3%B4t%C3%A9');
    });

    it('permet la recherche avec des chiffres', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: '514-123-4567' } });
        fireEvent.submit(form);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=514-123-4567');
    });

    it('permet la recherche avec des emails', () => {
        wrap(<SearchBar />);
        const input = screen.getByPlaceholderText('placeholder');
        const form = input.closest('form') as HTMLFormElement;

        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.submit(form);

        expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%40example.com');
    });
});