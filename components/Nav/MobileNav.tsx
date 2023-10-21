import { UserNavigationItem } from "@/types/types";
import { Disclosure, Transition } from "@headlessui/react";
import { Session } from "next-auth";
import Link from "next/link";
import { FunctionComponent } from "react";
import { navigation, subNav, userSubNav } from "../../config/site_settings";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface MobileNavProps {
  session: Session | null;
  userNavigation: UserNavigationItem[];
}

const MobileNav: FunctionComponent<MobileNavProps> = ({
  session,
  userNavigation,
}) => {
  return (
    <Transition
      enter="transition-transform duration-200"
      enterFrom="transform -translate-y-full opacity-0"
      enterTo="transform translate-y-0 opacity-100"
      className="absolute w-screen z-10 bg-neutral-100 dark:bg-black"
    >
      <Disclosure.Panel className="md:hidden relative z-10 border-b-2 border-black dark:border-white">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <NavItem item={item} key={item.name} />
          ))}
          <div className="pt-3 pb-3 border-t border-neutral-700 flex flex-col space-y-1">
            <SubNav session={session} />
          </div>
        </div>

        {session && (
          <div className="px-2 pt-2 space-y-1">
            <div className="pt-4 pb-3 border-t border-neutral-700">
              <div className="flex items-center px-5">
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
              <div className="flex flex-col self-start text-sm lg:text-base font-medium py-2">
                {userNavigation.map((item) =>
                  item.onClick ? (
                    <button
                      className="nav-button w-full "
                      key={item.name}
                      onClick={item.onClick}
                    >
                      <span className="flex place-self-start ml-1 py-1">
                        {item.name}
                      </span>
                    </button>
                  ) : (
                    <Link key={item.name} href={item.href}>
                      <Disclosure.Button
                        as="div"
                        className="w-full font-medium nav-button"
                      >
                        {item.name}
                      </Disclosure.Button>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </Disclosure.Panel>
    </Transition>
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
      <Disclosure.Button
        as="a"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-sm lg:text-base font-medium nav-button w-full"
      >
        {item.name}
      </Disclosure.Button>
    </Disclosure>
  ) : (
    <Disclosure>
      <Disclosure.Button
        as="a"
        href={item.href}
        rel="noopener noreferrer"
        className="flex items-center text-sm lg:text-base font-medium nav-button w-full"
      >
        {item.name}
      </Disclosure.Button>
    </Disclosure>
  );
};

interface SubNavProps {
  session: Session | null;
}

const SubNav: FunctionComponent<SubNavProps> = ({ session }) => {
  const data = session ? userSubNav : subNav;
  return (
    <>
      {data.map((item) => (
        <Link
          className={classNames(
            item.fancy
              ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-"
              : "text-neutral-900 hover:text-black hover:bg-neutral-300 focus:bg-neutral-300 dark:focus:bg-neutral-900 focus:text-black dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white block px-3",
            "rounded-md text-base font-medium py-2 text-center",
          )}
          key={item.name}
          href={item.href}
        >
          {item.name}
        </Link>
      ))}
    </>
  );
};
