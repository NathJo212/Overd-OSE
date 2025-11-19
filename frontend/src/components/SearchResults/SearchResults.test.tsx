import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchResults from './SearchResults';
import { BrowserRouter } from 'react-router-dom';

// Mock NavBar
vi.mock('../NavBar.tsx', () => ({
    __esModule: true,
    default: () => <div data-testid="navbar-mock" />,
}));

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));

// Mock du service utilisateur
vi.mock('../../services/UtilisateurService.ts', () => {
    return {
        default: {
            searchUsers: vi.fn(),
        },
    };
});

import utilisateurService from '../../services/UtilisateurService.ts';

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

beforeEach(() => {
    // Auth setup
    sessionStorage.setItem('userType', 'GESTIONNAIRE');
    sessionStorage.setItem('authToken', 'fake-token');

    // Default mock
    (utilisateurService.searchUsers as any).mockResolvedValue({
        etudiants: [],
        employeurs: [],
        professeurs: [],
        gestionnaires: [],
    });
});

afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
});

describe('SearchResults - comportements principaux', () => {
    it('affiche le message "performSearch" quand aucune recherche n\'a été effectuée', async () => {
        wrap(<SearchResults />);
        expect(screen.getByText('search.performSearch')).toBeInTheDocument();
    });

    it('affiche le loading lors d\'une recherche', async () => {
        (utilisateurService.searchUsers as any).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({
                etudiants: [],
                employeurs: [],
                professeurs: [],
                gestionnaires: [],
            }), 100))
        );

        wrap(<SearchResults />);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.click(searchButton);

        expect(screen.getByText('search.searching')).toBeInTheDocument();
    });

    it('affiche "noResults" quand aucun résultat n\'est trouvé', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [],
            employeurs: [],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
        fireEvent.click(searchButton);

        await waitFor(() => expect(screen.getByText('search.noResults')).toBeInTheDocument());
        expect(screen.getByText('search.tryDifferent')).toBeInTheDocument();
    });

    it('affiche les résultats d\'étudiants correctement', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [
                {
                    id: 1,
                    prenom: 'Jean',
                    nom: 'Dupont',
                    email: 'jean@example.com',
                    telephone: '514-123-4567',
                    progEtude: 'P180_A0'
                },
            ],
            employeurs: [],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'Jean' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
            expect(screen.getByText('jean@example.com')).toBeInTheDocument();
            expect(screen.getByText('514-123-4567')).toBeInTheDocument();
        });
    });

    it('affiche les résultats d\'employeurs correctement', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [],
            employeurs: [
                {
                    id: 1,
                    nomEntreprise: 'Tech Corp',
                    contact: 'Marie Tremblay',
                    email: 'marie@techcorp.com',
                    telephone: '438-987-6543'
                },
            ],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'Tech' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            expect(screen.getByText('marie@techcorp.com')).toBeInTheDocument();
        });
    });

    it('filtre par catégorie ETUDIANT', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [
                { id: 1, prenom: 'Alice', nom: 'Martin', email: 'alice@example.com', telephone: '514-111-2222' },
            ],
            employeurs: [],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const etudiantsButton = screen.getByText('search.categories.students');
        fireEvent.click(etudiantsButton);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'Alice' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByText('Alice Martin')).toBeInTheDocument();
        });

        expect(utilisateurService.searchUsers).toHaveBeenCalledWith('Alice', 'ETUDIANT');
    });

    it('filtre par catégorie EMPLOYEUR', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [],
            employeurs: [
                { id: 1, nomEntreprise: 'Innovation Inc', email: 'info@innovation.com', telephone: '514-555-1234' },
            ],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const employeursButton = screen.getByText('search.categories.employers');
        fireEvent.click(employeursButton);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'Innovation' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByText('Innovation Inc')).toBeInTheDocument();
        });

        expect(utilisateurService.searchUsers).toHaveBeenCalledWith('Innovation', 'EMPLOYEUR');
    });

    it('affiche le nombre de résultats trouvés', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [
                { id: 1, prenom: 'Alice', nom: 'A', email: 'a@e.com', telephone: '111' },
                { id: 2, prenom: 'Bob', nom: 'B', email: 'b@e.com', telephone: '222' },
            ],
            employeurs: [
                { id: 1, nomEntreprise: 'Corp A', email: 'c@e.com', telephone: '333' },
            ],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByText(/search.resultsCount/)).toBeInTheDocument();
        });
    });

    it('affiche le programme traduit pour les étudiants', async () => {
        (utilisateurService.searchUsers as any).mockResolvedValue({
            etudiants: [
                {
                    id: 1,
                    prenom: 'Marc',
                    nom: 'Gagnon',
                    email: 'marc@example.com',
                    telephone: '514-444-5555',
                    progEtude: 'P180_A0'
                },
            ],
            employeurs: [],
            professeurs: [],
            gestionnaires: [],
        });

        wrap(<SearchResults />);

        const searchInput = screen.getByPlaceholderText('search.placeholder');
        const searchButton = screen.getByText('search.button');

        fireEvent.change(searchInput, { target: { value: 'Marc' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByText('Marc Gagnon')).toBeInTheDocument();
            expect(screen.getByText(/search.program/)).toBeInTheDocument();
        });
    });

    it('cache la catégorie ETUDIANT pour les utilisateurs ETUDIANT', async () => {
        sessionStorage.setItem('userType', 'ETUDIANT');

        wrap(<SearchResults />);

        expect(screen.queryByText('search.categories.students')).not.toBeInTheDocument();
        expect(screen.getByText('search.categories.employers')).toBeInTheDocument();
        expect(screen.getByText('search.categories.professors')).toBeInTheDocument();
        expect(screen.getByText('search.categories.managers')).toBeInTheDocument();
    });
});