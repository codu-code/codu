import { FunctionComponent } from "react";

interface AnimatedHamburgerProps {
  open: Boolean;
}

const AnimatedHamburger: FunctionComponent<AnimatedHamburgerProps> = ({
  open,
}) => {
  return (
    <div className="text-neutral-400 w-6 h-6 relative focus:outline-none hover:text-white focus:text-white">
      <span className="sr-only">Open main menu</span>
      <div className="block w-5 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span
          aria-hidden="true"
          className={`block absolute h-0.5 w-5 bg-current transform transition ease-in-out ${
            open && "rotate-45"
          } ${!open && "-translate-y-1.5"}`}
        ></span>
        <span
          aria-hidden="true"
          className={`block absolute  h-0.5 w-5 bg-current   transform transition ease-in-out ${
            open && "opacity-0"
          }`}
        ></span>
        <span
          aria-hidden="true"
          className={`block absolute  h-0.5 w-5 bg-current transform  transition ease-in-out ${
            open && "-rotate-45"
          } ${!open && "translate-y-1.5"}`}
        ></span>
      </div>
    </div>
  );
};

export default AnimatedHamburger;
