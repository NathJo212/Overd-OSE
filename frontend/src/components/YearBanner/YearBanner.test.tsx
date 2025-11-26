import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import YearBanner from './YearBanner';

// Mock the YearContext module
vi.mock('../YearContext/YearContext.tsx', () => ({
    useYear: vi.fn(),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === 'yearBanner:warning') return 'You are viewing historical data';
            if (key === 'yearBanner:viewingYear') return `Viewing: ${options?.year}`;
            if (key === 'yearBanner:currentYear') return `Current: ${options?.year}`;
            return key;
        }
    }),
}));

import { useYear } from '../YearContext/YearContext.tsx';

describe('YearBanner - Display Logic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('n\'affiche rien quand on regarde l\'année actuelle (août ou après)', () => {
        // 15 août 2024 - année actuelle est 2025
        vi.setSystemTime(new Date(2024, 7, 15));

        // Mock useYear to return current year
        vi.mocked(useYear).mockReturnValue({ selectedYear: 2025, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        expect(container.firstChild).toBeNull();
    });

    it('n\'affiche rien quand on regarde l\'année actuelle (avant août)', () => {
        // 15 mai 2024 - année actuelle est 2024
        vi.setSystemTime(new Date(2024, 4, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        expect(container.firstChild).toBeNull();
    });

    it('affiche la bannière quand on regarde une année passée', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText('You are viewing historical data')).toBeInTheDocument();
    });

    it('affiche la bannière quand on regarde 2 années en arrière', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2023
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2023, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText('You are viewing historical data')).toBeInTheDocument();
        expect(screen.getByText(/Viewing: 2023/)).toBeInTheDocument();
    });
});

describe('YearBanner - Content Display', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('affiche l\'année sélectionnée correctement', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText(/Viewing: 2024/)).toBeInTheDocument();
    });

    it('affiche l\'année actuelle correctement', () => {
        // 15 août 2024 - année actuelle est 2025
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText(/Current: 2025/)).toBeInTheDocument();
    });

    it('affiche le message d\'avertissement', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText('You are viewing historical data')).toBeInTheDocument();
    });

    it('affiche l\'icône d\'alerte', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        // Lucide-react renders SVG, check for the icon
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});

describe('YearBanner - Styling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('applique les classes CSS d\'avertissement', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        const banner = container.querySelector('.bg-amber-50');
        expect(banner).toBeInTheDocument();
    });

    it('applique la bordure de gauche', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        const banner = container.querySelector('.border-l-4');
        expect(banner).toBeInTheDocument();
    });

    it('applique les classes dark mode', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        const banner = container.querySelector('.dark\\:bg-amber-900\\/20');
        expect(banner).toBeInTheDocument();
    });
});

describe('YearBanner - Edge Cases', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('gère correctement le changement d\'année à minuit le 1er août', () => {
        // 1 août 2024 à minuit - année actuelle devient 2025
        vi.setSystemTime(new Date(2024, 7, 1, 0, 0, 0));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText('You are viewing historical data')).toBeInTheDocument();
        expect(screen.getByText(/Current: 2025/)).toBeInTheDocument();
    });

    it('ne montre rien juste avant minuit le 1er août', () => {
        // 31 juillet 2024 à 23:59:59 - année actuelle est encore 2024
        vi.setSystemTime(new Date(2024, 6, 31, 23, 59, 59));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        expect(container.firstChild).toBeNull();
    });

    it('gère correctement les années très anciennes', () => {
        // 15 août 2024 - année actuelle est 2025, mais on regarde 2020
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2020, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText('You are viewing historical data')).toBeInTheDocument();
        expect(screen.getByText(/Viewing: 2020/)).toBeInTheDocument();
        expect(screen.getByText(/Current: 2025/)).toBeInTheDocument();
    });

    it('n\'affiche jamais la bannière pour une année future', () => {
        // 15 août 2024 - année actuelle est 2025, on regarde 2026 (futur)
        vi.setSystemTime(new Date(2024, 7, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2026, setSelectedYear: vi.fn() });

        const { container } = render(<YearBanner />);

        expect(container.firstChild).toBeNull();
    });
});

describe('YearBanner - Year Calculation Edge Cases', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('calcule correctement l\'année en janvier', () => {
        // 15 janvier 2024 - année actuelle est 2024
        vi.setSystemTime(new Date(2024, 0, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2023, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText(/Current: 2024/)).toBeInTheDocument();
    });

    it('calcule correctement l\'année en décembre', () => {
        // 31 décembre 2024 - année actuelle est 2025 (car on est après août)
        vi.setSystemTime(new Date(2024, 11, 31));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText(/Current: 2025/)).toBeInTheDocument();
    });

    it('calcule correctement l\'année en septembre', () => {
        // 15 septembre 2024 - année actuelle est 2025
        vi.setSystemTime(new Date(2024, 8, 15));

        vi.mocked(useYear).mockReturnValue({ selectedYear: 2024, setSelectedYear: vi.fn() });

        render(<YearBanner />);

        expect(screen.getByText(/Current: 2025/)).toBeInTheDocument();
    });
});