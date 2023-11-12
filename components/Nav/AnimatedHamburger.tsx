import { FunctionComponent } from "react";

interface AnimatedHamburgerProps {
  open: boolean;
}

const AnimatedHamburger: FunctionComponent<AnimatedHamburgerProps> = ({
  open,
}) => {
  return (
    <div
      className="relative h-6 w-6 text-neutral-600 focus:outline-none group-hover:text-neutral-900 
    group-focus:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white dark:group-focus:text-white"
    >
      <div className="absolute left-1/2 top-1/2 block w-5 -translate-x-1/2 -translate-y-1/2 transform">
        <span
          aria-hidden="true"
          className={`absolute block h-0.5 w-5 transform bg-current transition ease-in-out ${
            open && "rotate-45"
          } ${!open && "-translate-y-1.5"}`}
        ></span>
        <span
          aria-hidden="true"
          className={`absolute block h-0.5 w-5 transform   bg-current transition ease-in-out ${
            open && "opacity-0"
          }`}
        ></span>
        <span
          aria-hidden="true"
          className={`absolute block h-0.5 w-5 transform bg-current  transition ease-in-out ${
            open && "-rotate-45"
          } ${!open && "translate-y-1.5"}`}
        ></span>
      </div>
    </div>
  );
};

export default AnimatedHamburger;
