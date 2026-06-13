"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export const THEME_MODES = {
  DARK: "dark",
  LIGHT: "light",
};

// Subscribe to nothing - this is just to detect client-side rendering
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const ThemeToggle = () => {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { resolvedTheme, setTheme } = useTheme();

  if (!mounted) return null;

  const toggleTheme = () => {
    const newTheme =
      resolvedTheme === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={resolvedTheme === THEME_MODES.DARK}
      className="nav-button focus-style group relative flex-shrink-0 p-4 focus:ring-inset"
      type="button"
      title="Toggle dark mode"
    >
      <span className="sr-only">Toggle Dark Mode</span>
      <SunIcon className="h-6 w-6 rotate-0 scale-100 text-muted group-hover:text-yellow-500 group-focus:text-yellow-500 motion-safe:transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transform text-faint group-hover:text-white motion-safe:transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
};

export default ThemeToggle;
