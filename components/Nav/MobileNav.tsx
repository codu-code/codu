import { Disclosure, Transition } from "@headlessui/react";
import Link from "next/link";
import { FunctionComponent } from "react";
import { navigation, subNav, userSubNav } from "../../config/site_settings";
import { UserNavigationItem } from "@/types/types";
import { Session } from "next-auth";

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
              <div className="mt-3 space-y-1">
                {userNavigation.map((item) =>
                  item.onClick ? (
                    <Disclosure.Button
                      key={item.name}
                      as="button"
                      onClick={item.onClick}
                      className="nav-button w-full text-left font-medium"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ) : (
                    <Link key={item.name} href={item.href}>
                      <Disclosure.Button
                        as="div"
                        className="nav-button w-full text-left font-medium"
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
    <Disclosure.Button
      as="a"
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="nav-button block text-base font-medium"
    >
      {item.name}
    </Disclosure.Button>
  ) : (
    <Link href={item.href}>
      <Disclosure.Button
        as="div"
        className="nav-button block text-base font-medium"
      >
        {item.name}
      </Disclosure.Button>
    </Link>
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
              ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
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
