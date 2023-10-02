import { Disclosure } from "@headlessui/react";
import { signOut, signIn } from "next-auth/react";
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
  count: number | undefined;
  userNavigation: UserNavigationItem[];
}

const MobileNav: FunctionComponent<MobileNavProps> = ({
  session,
  count,
  userNavigation,
}) => {
  return (
    <Disclosure.Panel className="md:hidden relative z-10 border-b-2 border-white">
      <div className="px-2 pt-2 pb-3 space-y-1">
        {navigation.map((item) =>
          item.href.includes("http") ? (
            <Disclosure.Button
              as="a"
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-button block text-base font-medium"
            >
              {item.name}
            </Disclosure.Button>
          ) : (
            <Link key={item.name} href={item.href}>
              <Disclosure.Button
                as="div"
                className="nav-button block text-base font-medium"
              >
                {item.name}
              </Disclosure.Button>
            </Link>
          )
        )}

        <div className="pt-3 pb-3 border-t border-neutral-700 flex flex-col space-y-1">
          {session ? (
            <>
              {userSubNav.map((item) => (
                <Link
                  className={classNames(
                    item.fancy
                      ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                      : "text-neutral-900 hover:text-black hover:bg-neutral-300 focus:bg-neutral-300 focus:text-black dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white block px-3",
                    "rounded-md text-base font-medium py-2 text-center"
                  )}
                  key={item.name}
                  href={item.href}
                >
                  {item.name}
                </Link>
              ))}
            </>
          ) : (
            <>
              {subNav.map((item) => (
                <button
                  className={classNames(
                    item.fancy
                      ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                      : "text-neutral-300 hover:bg-neutral-900 hover:text-white block px-3",
                    "rounded-md text-base font-medium py-2"
                  )}
                  key={item.name}
                  onClick={() => signIn()}
                >
                  {item.name}
                </button>
              ))}
            </>
          )}
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
                )
              )}
            </div>
          </div>
        </div>
      )}
    </Disclosure.Panel>
  );
};

export default MobileNav;
