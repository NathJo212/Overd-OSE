import { render, screen, renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { YearProvider, useYear } from './YearContext';

describe('YearContext - Year Calculation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('retourne année + 1 quand on est en août ou après', () => {
        // 15 août 2024
        vi.setSystemTime(new Date(2024, 7, 15));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2025);
    });

    it('retourne année + 1 quand on est en septembre', () => {
        // 1 septembre 2024
        vi.setSystemTime(new Date(2024, 8, 1));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2025);
    });

    it('retourne année + 1 quand on est en décembre', () => {
        // 31 décembre 2024
        vi.setSystemTime(new Date(2024, 11, 31));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2025);
    });

    it('retourne année courante quand on est en janvier', () => {
        // 15 janvier 2024
        vi.setSystemTime(new Date(2024, 0, 15));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2024);
    });

    it('retourne année courante quand on est en juillet', () => {
        // 31 juillet 2024
        vi.setSystemTime(new Date(2024, 6, 31));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2024);
    });

    it('retourne année courante quand on est en mai', () => {
        // 15 mai 2024
        vi.setSystemTime(new Date(2024, 4, 15));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2024);
    });
});

describe('YearContext - State Management', () => {
    it('permet de changer l\'année sélectionnée', () => {
        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        act(() => {
            result.current.setSelectedYear(2023);
        });

        expect(result.current.selectedYear).toBe(2023);
    });

    it('permet de changer l\'année plusieurs fois', () => {
        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        act(() => {
            result.current.setSelectedYear(2023);
        });

        expect(result.current.selectedYear).toBe(2023);

        act(() => {
            result.current.setSelectedYear(2024);
        });

        expect(result.current.selectedYear).toBe(2024);

        act(() => {
            result.current.setSelectedYear(2025);
        });

        expect(result.current.selectedYear).toBe(2025);
    });

    it('partage l\'état entre plusieurs composants', () => {
        const TestComponent1 = () => {
            const { selectedYear } = useYear();
            return <div data-testid="component1">{selectedYear}</div>;
        };

        const TestComponent2 = () => {
            const { selectedYear } = useYear();
            return <div data-testid="component2">{selectedYear}</div>;
        };

        const TestComponent3 = () => {
            const { setSelectedYear } = useYear();
            return (
                <button onClick={() => setSelectedYear(2022)} data-testid="change-year">
                    Change Year
                </button>
            );
        };

        render(
            <YearProvider>
                <TestComponent1 />
                <TestComponent2 />
                <TestComponent3 />
            </YearProvider>
        );

        const component1 = screen.getByTestId('component1');
        const component2 = screen.getByTestId('component2');
        const button = screen.getByTestId('change-year');

        // Initial values should match
        expect(component1.textContent).toBe(component2.textContent);

        // Change year from one component
        act(() => {
            button.click();
        });

        // Both components should update
        expect(component1.textContent).toBe('2022');
        expect(component2.textContent).toBe('2022');
    });
});

describe('YearContext - Error Handling', () => {
    it('lance une erreur si useYear est utilisé sans YearProvider', () => {
        // Suppress console.error for this test
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const TestComponent = () => {
            useYear();
            return <div>Test</div>;
        };

        expect(() => render(<TestComponent />)).toThrow(
            'useYear must be used within a YearProvider'
        );

        consoleError.mockRestore();
    });

    it('fonctionne correctement quand utilisé avec YearProvider', () => {
        const TestComponent = () => {
            const { selectedYear } = useYear();
            return <div data-testid="year">{selectedYear}</div>;
        };

        expect(() =>
            render(
                <YearProvider>
                    <TestComponent />
                </YearProvider>
            )
        ).not.toThrow();

        expect(screen.getByTestId('year')).toBeInTheDocument();
    });
});

describe('YearContext - Edge Cases', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('gère correctement le premier jour d\'août', () => {
        // 1 août 2024 à minuit
        vi.setSystemTime(new Date(2024, 7, 1, 0, 0, 0));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2025);
    });

    it('gère correctement le dernier jour de juillet', () => {
        // 31 juillet 2024 à 23:59:59
        vi.setSystemTime(new Date(2024, 6, 31, 23, 59, 59));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2024);
    });

    it('gère correctement le premier jour de janvier', () => {
        // 1 janvier 2024 à minuit
        vi.setSystemTime(new Date(2024, 0, 1, 0, 0, 0));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2024);
    });

    it('gère correctement le dernier jour de décembre', () => {
        // 31 décembre 2024 à 23:59:59
        vi.setSystemTime(new Date(2024, 11, 31, 23, 59, 59));

        const { result } = renderHook(() => useYear(), {
            wrapper: YearProvider,
        });

        expect(result.current.selectedYear).toBe(2025);
    });
});

describe('YearContext - Provider Nesting', () => {
    it('gère correctement les providers imbriqués', () => {
        const TestComponent = () => {
            const { selectedYear, setSelectedYear } = useYear();
            return (
                <div>
                    <span data-testid="year">{selectedYear}</span>
                    <button onClick={() => setSelectedYear(2020)} data-testid="set-year">
                        Set Year
                    </button>
                </div>
            );
        };

        render(
            <YearProvider>
                <YearProvider>
                    <TestComponent />
                </YearProvider>
            </YearProvider>
        );

        const yearDisplay = screen.getByTestId('year');
        const button = screen.getByTestId('set-year');

        expect(yearDisplay).toBeInTheDocument();

        act(() => {
            button.click();
        });

        expect(yearDisplay.textContent).toBe('2020');
    });
});