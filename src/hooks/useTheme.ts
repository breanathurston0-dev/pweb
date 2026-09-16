import { useEffect, useState } from "react";

export function useTheme() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check localStorage first
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    // Fallback to media query system preference
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return { darkMode, setDarkMode, toggleTheme };
}
