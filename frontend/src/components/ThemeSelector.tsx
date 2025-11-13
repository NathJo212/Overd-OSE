import { useEffect, useRef, useState } from "react";
import { Moon, Sun} from "lucide-react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getSystemTheme(): Exclude<ThemeChoice, "system"> {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(choice: ThemeChoice) {
  const effective = choice === "system" ? getSystemTheme() : choice;
  const root = document.documentElement;
 root.dataset.theme = effective;
}

const ThemeSelector = ({ className = "" }: { className?: string }) => {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [systemTick, setSystemTick] = useState(0);
  const mountedRef = useRef(false);

  // Initialize from storage and apply
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice | null) || "system";
    setChoice(stored);
    applyTheme(stored);
    mountedRef.current = true;
  }, []);

  // Watch system changes when in system mode; trigger re-render to refresh highlight
  useEffect(() => {
    if (choice !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { applyTheme("system"); setSystemTick((v) => v + 1); };
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [choice]);

  const setTheme = (value: ThemeChoice) => {
    setChoice(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  };

  const effective = choice === "system" ? getSystemTheme() : choice;
  void systemTick; // used to trigger re-render on system changes

  return (
    <div className={`flex items-center gap-2 bg-white/95 dark:bg-slate-800/80 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 dark:border-slate-700 hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="flex gap-1">
        <button
          onClick={() => setTheme("light")}
          aria-pressed={effective === "light"}
          className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
            effective === "light" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          }`}
          title="Light"
          aria-label="Light theme"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          aria-pressed={effective === "dark"}
          className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
            effective === "dark" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          }`}
          title="Dark"
          aria-label="Dark theme"
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
