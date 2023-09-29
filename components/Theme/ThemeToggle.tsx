import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { SunIcon, MoonIcon, DesktopComputerIcon } from "@heroicons/react/solid";
import { useTheme } from "next-themes";

//
// FUTURE CSS FIX - Menu - inline block, top alignment - customisable css classname prop.

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Menu
      as="div"
      className="relative flex justify-center items-center text-neutral-400 hover:text-neutral-300 focus:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ml-3 rounded-full"
    >
      <Menu.Button className="relative h-full">
        <SunIcon className="w-6 h-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute top-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right top-7 absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item
            as="button"
            className="relative flex cursor-default text-base md:text-sm select-none items-center rounded-sm font-medium outline-none hover:hover:bg-neutral-200   focus:hover:bg-neutral-200  data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700 text-black w-full px-4 py-2"
            onClick={() => setTheme("light")}
          >
            <SunIcon className="mr-2 h-4 w-4" />
            <span>Light</span>
          </Menu.Item>
          <Menu.Item
            as="button"
            className="relative flex cursor-default text-base md:text-sm select-none items-center rounded-sm px-4 py-2 font-medium outline-none w-full hover:hover:bg-neutral-200   focus:hover:bg-neutral-200  data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700 text-black"
            onClick={() => setTheme("dark")}
          >
            <MoonIcon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </Menu.Item>
          <Menu.Item
            as="button"
            className="relative flex cursor-default text-base md:text-sm select-none items-center rounded-sm px-4 py-2 font-medium outline-none w-full hover:bg-neutral-200   focus:hover:bg-neutral-200  data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700
            text-black"
            onClick={() => setTheme("dark")}
          >
            <DesktopComputerIcon className="mr-2 h-4 w-4" />
            <span>System</span>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ThemeToggle;
