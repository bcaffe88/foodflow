import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check localStorage first
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // Update DOM
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Save preference
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div data-testid="theme-provider">
      {children}
      <div
        className="fixed bottom-4 right-4 z-50"
        onClick={toggleTheme}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggleTheme();
          }
        }}
        role="button"
        tabIndex={0}
        data-testid="button-theme-toggle"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <button
          className="w-10 h-10 rounded-full bg-card hover:bg-card/80 border border-border flex items-center justify-center transition-colors"
          data-testid="icon-theme-toggle"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}
