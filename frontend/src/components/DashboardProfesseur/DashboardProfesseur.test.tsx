import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DashboardProfesseur from './DashboardProfesseur';
import { BrowserRouter } from 'react-router-dom';

// Mock NavBar (on ne teste pas NavBar)
vi.mock('../NavBar.tsx', () => ({
    __esModule: true,
    default: () => <div data-testid="navbar-mock" />,
}));

// Mock i18n : renvoie la clé pour faciliter les assertions
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));

// Mock du service professeur
vi.mock('../../services/ProfesseurService.ts', () => {
    return {
        professeurService: {
            getEvaluationsMilieuStage: vi.fn(),
            getMesEtudiants: vi.fn(),
            getEntentesPourEtudiant: vi.fn(),
            getCandidaturesPourEtudiant: vi.fn(),
            getStatutStage: vi.fn(),
            getCV: vi.fn(),
            getLettreMotivation: vi.fn(),
            getEvaluationMilieuStagePdf: vi.fn(),
            creerEvaluationMilieuStage: vi.fn(),
        },
    };
});

import { professeurService } from '../../services/ProfesseurService.ts';

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

beforeEach(() => {
    // Auth setup for component (évite la redirection vers /login)
    sessionStorage.setItem('userType', 'PROFESSEUR');
    sessionStorage.setItem('authToken', 'fake-token');

    // Default mocks
    (professeurService.getEvaluationsMilieuStage as any).mockResolvedValue([]);
    (professeurService.getMesEtudiants as any).mockResolvedValue([]);
    (professeurService.getEntentesPourEtudiant as any).mockResolvedValue([]);
    (professeurService.getCandidaturesPourEtudiant as any).mockResolvedValue([]);
    (professeurService.getStatutStage as any).mockResolvedValue(null);
    (professeurService.getCV as any).mockResolvedValue(new Blob(['cv']));
    (professeurService.getLettreMotivation as any).mockResolvedValue(new Blob(['lettre']));
    (professeurService.getEvaluationMilieuStagePdf as any).mockResolvedValue(new Blob(['pdf']));
    (professeurService.creerEvaluationMilieuStage as any).mockResolvedValue({});

    // mock createObjectURL
    vi.stubGlobal(
        'URL',
        {
            createObjectURL: vi.fn(() => 'blob:fake'),
            revokeObjectURL: vi.fn(),
        } as any
    );
});

afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
});

describe('DashboardProfesseur - comportements principaux', () => {
    it('affiche le loading puis message "noStudents" quand aucun étudiant', async () => {
        (professeurService.getMesEtudiants as any).mockResolvedValue([]);
        wrap(<DashboardProfesseur />);
        expect(screen.getByText('status.loading')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        expect(screen.getByText('status.noStudents')).toBeInTheDocument();
    });

    it('affiche un étudiant sans CV', async () => {
        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 1, prenom: 'Jean', nom: 'Dupont', email: 'j@e.com', telephone: '123', progEtude: undefined, cv: '' },
        ]);
        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('students.noCV')).toBeInTheDocument();
    });

    it('ouvre le viewer PDF quand on clique sur "viewCV"', async () => {
        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 2, prenom: 'Alice', nom: 'Martin', email: 'a@e.com', telephone: '111', progEtude: 'PROG', cv: 'present' },
        ]);
        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        const viewButtons = screen.getAllByText('actions.viewCV');
        expect(viewButtons.length).toBeGreaterThan(0);
        fireEvent.click(viewButtons[0]);
        await waitFor(() => expect(professeurService.getCV).toHaveBeenCalledWith(2, 'fake-token'));
        expect(screen.getByText('pdf.cvTitle')).toBeInTheDocument();
        expect(screen.getByTitle('pdf.cvTitle')).toHaveAttribute('src', 'blob:fake');
    });

    it('ouvre la modal d’évaluation et valide la soumission', async () => {
        const entente = {
            id: 10,
            titre: 'Entente X',
            nomEntreprise: 'CompX',
            employeurContact: 'ContactX',
            dateDebut: new Date().toISOString(),
            dateFin: new Date().toISOString(),
            lieu: 'Lieu',
            etudiantSignature: 'SIGNEE',
            employeurSignature: 'SIGNEE',
        };
        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 3, prenom: 'Marc', nom: 'B', email: 'm@e', telephone: '000', progEtude: 'PROG', cv: '' },
        ]);
        (professeurService.getEntentesPourEtudiant as any).mockResolvedValue([entente]);
        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        const evaluateButtons = screen.getAllByText('actions.evaluate');
        fireEvent.click(evaluateButtons[0]);
        await waitFor(() => expect(screen.getByText('Entente X')).toBeInTheDocument());
        const submitBtn = screen.getByText('form.submit');
        fireEvent.click(submitBtn);
        await waitFor(() => expect(screen.getByText('errors.selectStageNumber')).toBeInTheDocument());
        fireEvent.click(screen.getByText('options.stageNumero.STAGE_1'));
        fireEvent.click(screen.getByText('options.niveauAccord.TOTALEMENT_EN_ACCORD'));
        fireEvent.click(submitBtn);
        await waitFor(() => expect(professeurService.creerEvaluationMilieuStage).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByText('messages.success')).toBeInTheDocument());
    });

    it('affiche les candidatures et permet d’ouvrir la lettre PDF', async () => {
        const candid = {
            id: 42,
            offreTitre: 'Stage Dev',
            employeurNom: 'Firm',
            dateCandidature: new Date().toISOString(),
            alettreMotivation: true,
        };
        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 4, prenom: 'Lou', nom: 'Z', email: 'l@e', telephone: '9', progEtude: 'P', cv: '' },
        ]);
        (professeurService.getCandidaturesPourEtudiant as any).mockResolvedValue([candid]);
        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        fireEvent.click(screen.getAllByTitle('Candidatures')[0]);
        await waitFor(() => expect(screen.getByText('candidatures.title')).toBeInTheDocument());
        expect(screen.getByText('Stage Dev')).toBeInTheDocument();
        fireEvent.click(screen.getByText('actions.viewLetter'));
        await waitFor(() => expect(professeurService.getLettreMotivation).toHaveBeenCalledWith(42, 'fake-token'));
        expect(screen.getByText('pdf.letterTitle')).toBeInTheDocument();
    });

    it('affiche les ententes et leur statut', async () => {
        const ent = {
            id: 55,
            titre: 'Entente Y',
            description: 'Desc',
            employeurContact: 'Emp',
            lieu: 'L',
            dateDebut: new Date().toISOString(),
            dateFin: new Date().toISOString(),
            dureeHebdomadaire: 35,
            etudiantSignature: 'SIGNEE',
            employeurSignature: 'SIGNEE',
        };
        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 5, prenom: 'S', nom: 'T', email: 's@e', telephone: '0', progEtude: 'P', cv: '' },
        ]);
        (professeurService.getEntentesPourEtudiant as any).mockResolvedValue([ent]);
        (professeurService.getStatutStage as any).mockResolvedValue('STATUT_OK');
        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        fireEvent.click(screen.getAllByTitle('Ententes')[0]);
        await waitFor(() => expect(screen.getByText('actions.ententes')).toBeInTheDocument());
        expect(screen.getByText('Entente Y')).toBeInTheDocument();
        expect(screen.getByText('ententes.statusLabel')).toBeInTheDocument();
    });

    it('affiche "viewEvaluation" si une évaluation existe déjà', async () => {
        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 6, prenom: 'Eval', nom: 'User', email: 'e@e', telephone: '1', progEtude: 'P', cv: '' },
        ]);
        (professeurService.getEvaluationsMilieuStage as any).mockResolvedValue([
            { id: 99, etudiantId: 6, dateEvaluation: new Date().toISOString(), prenomEtudiant: 'Eval', nomEtudiant: 'User', nomEntreprise: 'X', prenomProfesseur: 'Prof', nomProfesseur: 'P' },
        ]);
        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());
        fireEvent.click(screen.getByText('actions.viewEvaluation'));
        await waitFor(() => expect(professeurService.getEvaluationMilieuStagePdf).toHaveBeenCalledWith(99));
        expect(screen.getByText('pdf.evaluationTitle')).toBeInTheDocument();
    });
});
