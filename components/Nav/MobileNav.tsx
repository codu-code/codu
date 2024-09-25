import { type UserNavigationItem } from "@/types/types";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { type Session } from "next-auth";
import { PromptLink as Link } from "../PromptService/PromptLink";
import { type MutableRefObject, useRef, type FunctionComponent } from "react";
import { navigation, subNav, userSubNav } from "../../config/site_settings";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface MobileNavProps {
  session: Session | null;
  userNavigation: UserNavigationItem[];
  close?: () => void;
}

const MobileNav: FunctionComponent<MobileNavProps> = ({
  session,
  userNavigation,
  close,
}) => {
  return (
    <div className="absolute z-10 w-screen bg-neutral-100 dark:bg-black">
      <DisclosurePanel className="relative border-b border-neutral-400 dark:border-neutral-600 md:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <NavItem item={item} key={item.name} />
          ))}
          <div className="flex flex-col space-y-1 border-t border-neutral-400 pb-3 pt-3 dark:border-neutral-600">
            <SubNav session={session} close={close} />
          </div>
        </div>

        {session && (
          <div className="space-y-1 px-2 pt-2">
            <div className="border-t border-neutral-400 pb-3 pt-4 dark:border-neutral-600">
              <div className="flex items-center px-2">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={session.user?.image || "/images/person.png"}
                    alt={`${session.user?.name}'s avatar`}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-black dark:text-white">
                    {session.user?.name}
                  </div>
                  <div className="text-sm font-medium text-neutral-400">
                    {session.user?.email}
                  </div>
                </div>
              </div>
              <div className="flex flex-col self-start py-2 text-sm font-medium lg:text-base">
                {userNavigation.map((item) =>
                  item.onClick ? (
                    <button
                      className="nav-button w-full "
                      key={item.name}
                      onClick={item.onClick}
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link key={item.name} to={item.href}>
                      <DisclosureButton
                        as="div"
                        className="nav-button w-full font-medium"
                      >
                        {item.name}
                      </DisclosureButton>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </DisclosurePanel>
    </div>
  );
};

export default MobileNav;

interface NavItemProps {
  item: {
    name: string;
    href: string;
  };
}

const NavItem: FunctionComponent<NavItemProps> = ({ item }) => {
  return item.href.includes("http") ? (
    <Disclosure>
      <DisclosureButton
        as="a"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-button flex w-full items-center text-sm font-medium lg:text-base"
      >
        {item.name}
      </DisclosureButton>
    </Disclosure>
  ) : (
    <Disclosure>
      <DisclosureButton
        as="a"
        href={item.href}
        rel="noopener noreferrer"
        className="nav-button flex w-full items-center text-sm font-medium lg:text-base"
      >
        {item.name}
      </DisclosureButton>
    </Disclosure>
  );
};

interface SubNavProps {
  session: Session | null;
  close?: (
    focusableElement?:
      | HTMLElement
      | MutableRefObject<HTMLElement | null>
      | undefined,
  ) => void;
}

const SubNav: FunctionComponent<SubNavProps> = ({ session, close }) => {
  const disclosureButtonRef = useRef(null);
  const data = session ? userSubNav : subNav;
  return (
    <>
      {data.map((item) => (
        <Disclosure key={item.name}>
          <DisclosureButton
            as={Link}
            to={item.href}
            close={close}
            ref={disclosureButtonRef}
            className={classNames(
              item.fancy
                ? "block justify-center bg-gradient-to-r from-orange-400 to-pink-600 px-4 text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                : "block px-3 text-neutral-900 hover:bg-neutral-300 hover:text-black focus:bg-neutral-300 focus:text-black dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white dark:focus:bg-neutral-900",
              "rounded-md py-2 text-center text-base font-medium",
            )}
          >
            {item.name}
          </DisclosureButton>
        </Disclosure>
      ))}
    </>
  );
};
