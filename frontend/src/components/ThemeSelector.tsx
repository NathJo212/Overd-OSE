import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

// Inline theme selector (Light | Dark | System)
// - Persists selection in localStorage (key: theme)
// - Applies theme by toggling html.dark and setting data-theme
// - Listens to system changes when choice === 'system'

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
  if (effective === "dark") root.classList.add("dark"); else root.classList.remove("dark");
  root.dataset.theme = effective;
}

const ThemeSelector = ({ className = "" }: { className?: string }) => {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const mountedRef = useRef(false);

  // Initialize from storage and apply
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice | null) || "system";
    setChoice(stored);
    applyTheme(stored);
    mountedRef.current = true;
  }, []);

  // Watch system changes when in system mode
  useEffect(() => {
    if (choice !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
    else // @ts-ignore older Safari
      mql.addListener(onChange);
    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
      else // @ts-ignore
        mql.removeListener(onChange);
    };
  }, [choice]);

  const setTheme = (value: ThemeChoice) => {
    setChoice(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  };

  // Container mirrors LanguageSelector styling
  return (
    <div className={`flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      {/* Lead icon reflects current effective theme choice (not system-resolved) */}
      {choice === "dark" ? (
        <Moon className="w-4 h-4 text-gray-500" />
      ) : choice === "light" ? (
        <Sun className="w-4 h-4 text-gray-500" />
      ) : (
        <Monitor className="w-4 h-4 text-gray-500" />
      )}

      <div className="flex gap-1">
        <button
          onClick={() => setTheme("light")}
          className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
            choice === "light" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Light"
          aria-label="Light theme"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
            choice === "dark" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Dark"
          aria-label="Dark theme"
        >
          <Moon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`cursor-pointer px-3 py-1 text-sm rounded-md font-medium transition-all duration-200 ${
            choice === "system" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="System"
          aria-label="System theme"
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
