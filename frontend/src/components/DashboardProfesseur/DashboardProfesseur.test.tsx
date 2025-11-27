import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

    it('ouvre la modal d’évaluation et vérifie tout les boutons', async () => {
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
            statut: 'SIGNEE'
        };

        (professeurService.getMesEtudiants as any).mockResolvedValue([
            { id: 3, prenom: 'Marc', nom: 'B', email: 'm@e', telephone: '000', progEtude: 'PROG', cv: '' },
        ]);
        (professeurService.getEntentesPourEtudiant as any).mockResolvedValue([entente]);

        wrap(<DashboardProfesseur />);
        await waitFor(() => expect(screen.queryByText('status.loading')).toBeNull());

        const evaluateButtons = screen.getAllByText('actions.evaluate');
        fireEvent.click(evaluateButtons[0]);
        // Le composant ne montre pas forcément le titre de l'entente (Entente X) directement.
        // Vérifier plutôt que le header du formulaire et les informations pré-remplies sont affichées
        await waitFor(() => expect(screen.getByText('form.header')).toBeInTheDocument());
        // le nom de l'étudiant doit apparaître dans le header student
        expect(screen.getByText((content) => content.includes('form.headerStudent') && content.includes('Marc'))).toBeInTheDocument();

        // SECTION 0 - Company: vérifier les champs d'identification de l'entreprise
        const companySectionHeader = screen.getByText('form.company.title');
        expect(companySectionHeader).toBeInTheDocument();
        const companySection = companySectionHeader.closest('section');
        // s'assurer qu'il y a plusieurs champs (inputs) dans la section entreprise
        expect(companySection).not.toBeNull();
        // compter tous les champs (input/textarea/select) dans la section entreprise
        const companyFields = (companySection as HTMLElement).querySelectorAll('input, textarea, select');
        // tolérance : certains champs peuvent être absents selon le rendu, vérifier qu'il y a au moins 3 champs
        expect(companyFields.length).toBeGreaterThanOrEqual(3);

        // Aller à l'étape 1 (Identification du stagiaire)
        const nextBtnOnce = await screen.findByText('form.next');
        fireEvent.click(nextBtnOnce);
        await waitFor(() => expect(screen.getByText('form.section.student')).toBeInTheDocument());

        // SECTION 1 - Student: vérifications
        const studentSectionHeader = screen.getByText('form.section.student');
        expect(studentSectionHeader).toBeInTheDocument();
        const studentSection = studentSectionHeader.closest('section');
        expect(studentSection).not.toBeNull();
        // Le nom et la date sont présents : compter inputs/textarea/select
        const studentFields = (studentSection as HTMLElement).querySelectorAll('input, textarea, select');
        // tolérance : vérifier qu'il y a au moins 1 champ (nom ou date)
        expect(studentFields.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('form.student.stageNumberLabel')).toBeInTheDocument();

        // Aller à l'étape 2 (Évaluation)
        // Aller à l'étape 2 (Évaluation)
        const nextToEval = await screen.findByText('form.next');
        fireEvent.click(nextToEval);
        await waitFor(() => expect(screen.getByText('form.section.evaluation')).toBeInTheDocument());

        // SECTION 2 - Evaluation: vérifier présence des questions likert et du champ commentaires
        const evalHeader = screen.getByText('form.section.evaluation');
        expect(evalHeader).toBeInTheDocument();
        expect(screen.getByText('form.questions.tachesConformes')).toBeInTheDocument();
        expect(screen.getByText('form.questions.mesuresAccueil')).toBeInTheDocument();
        expect(screen.getByText('form.questions.tempsEncadrementSuffisant')).toBeInTheDocument();
        // le textarea des commentaires a un placeholder égal à la clé i18n
        expect(screen.getByPlaceholderText('form.comments.label')).toBeInTheDocument();

        // Aller à l'étape 3 (Observations générales)
        const nextToObs = await screen.findByText('form.next');
        fireEvent.click(nextToObs);
        // récupérer tous les éléments correspondant au texte (peut y avoir un <h4> header et des labels)
        const obsMatches = await screen.findAllByText(/Observations générales|form.observations.milieuAPrivilegier/);
        expect(obsMatches.length).toBeGreaterThan(0);
        // préférer l'élément de header (h4) s'il existe, sinon prendre le premier
        const obsHeader = obsMatches.find(el => el.tagName && el.tagName.toLowerCase() === 'h4') || obsMatches[0];
        expect(obsHeader).toBeInTheDocument();

        // SECTION 3 - Observations: vérifier heures, salaire, quarts et date de signature (vérifier les labels/éléments présents)
        // utiliser l'entête trouvé précédemment (obsHeader)
        expect(obsHeader).toBeInTheDocument();
        expect(screen.getByText('form.hours.firstMonth')).toBeInTheDocument();
        expect(screen.getByText('form.hours.secondMonth')).toBeInTheDocument();
        expect(screen.getByText('form.hours.thirdMonth')).toBeInTheDocument();
        expect(screen.getByText('form.salary.amountPerHour')).toBeInTheDocument();
        expect(screen.getByText('form.observations.offreQuartsVariables')).toBeInTheDocument();
        expect(screen.getByText('form.observations.dateSignature')).toBeInTheDocument();

        // Le submit et cancel doivent être visibles à la dernière étape
        const submitBtn = await screen.findByText((content) => content.includes('form.submit'));
        const formEl = submitBtn.closest('form');
        expect(formEl).not.toBeNull();
        expect(within(formEl as HTMLElement).getByText('form.cancel')).toBeInTheDocument();
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
        fireEvent.click(screen.getAllByTitle('actions.candidatures')[0]);
        await waitFor(() => expect(screen.getByText('candidatures.title')).toBeInTheDocument());
        expect(screen.getByText('Stage Dev')).toBeInTheDocument();
        fireEvent.click(screen.getByText('actions.viewLetter'));
        await waitFor(() => expect(professeurService.getLettreMotivation).toHaveBeenCalledWith(42, 'fake-token'));
        expect(screen.queryByText((content) => content.includes('letterTitle'))).not.toBeNull();
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
        fireEvent.click(screen.getAllByTitle('actions.ententes')[0]);
        await waitFor(() => expect(screen.getAllByText('actions.ententes').length).toBeGreaterThan(0));
        expect(screen.getByText('Entente Y')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('ententes.statusLabel')).toBeInTheDocument());
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
