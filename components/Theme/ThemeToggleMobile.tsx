import { MoonIcon, SunIcon } from "@heroicons/react/solid";
import { useTheme } from "next-themes";

const ThemeToggleMobile = () => {
  const { setTheme } = useTheme();

  function toggleTheme(theme: string) {
    return theme === "light" ? setTheme("dark") : setTheme("light");
  }

  return (
    <div className="relative h-full">
      <SunIcon
        onClick={() => toggleTheme("light")}
        className="cursor-pointer text-neutral-400 hover:text-yellow-500 focus:text-yellow-500  w-6 h-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <MoonIcon
        onClick={() => toggleTheme("dark")}
        className="cursor-pointer absolute text-neutral-400 top-0 hover:text-white focus:text-white rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </div>
  );
};

export default ThemeToggleMobile;
