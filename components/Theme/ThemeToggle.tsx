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
      className="nav-button p-4 group relative flex-shrink-0 focus:ring-inset focus-style"
    >
      <SunIcon className="text-neutral-600 group-hover:text-yellow-500 group-focus:text-yellow-500 w-6 h-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-neutral-400 w-6 h-6 group-hover:text-white rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
