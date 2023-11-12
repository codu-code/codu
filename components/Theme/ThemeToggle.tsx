import { MoonIcon, SunIcon } from "@heroicons/react/solid";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  function toggleTheme() {
    return theme === "light" ? setTheme("dark") : setTheme("light");
  }

  return (
    <button
      onClick={toggleTheme}
      className="nav-button focus-style group relative flex-shrink-0 p-4 focus:ring-inset"
    >
      <SunIcon className="h-6 w-6 rotate-0 scale-100 text-neutral-600 transition-all group-hover:text-yellow-500 group-focus:text-yellow-500 dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transform text-neutral-400 transition-all group-hover:text-white dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
