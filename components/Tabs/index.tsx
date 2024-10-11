import { useRouter } from "next/navigation";
import Link from "next/link";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type Tab = {
  name: string;
  href: string;
  value: string;
  current: boolean;
};

type Props = {
  tabs: Tab[];
};

export function Tabs(props: Props) {
  const { tabs } = props;
  const router = useRouter();

  return (
    <div className="max-w-5xl">
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-neutral-300 bg-white focus:border-neutral-500 focus:ring-neutral-500 dark:bg-neutral-900"
          defaultValue={tabs.find((tab) => tab.current)?.name || tabs[0].name}
          onChange={(e) => {
            router.push(e.target.value);
          }}
        >
          {tabs.map((tab) => (
            <option value={tab.href} key={tab.name}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-neutral-300 dark:border-neutral-800">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={classNames(
                  tab.current
                    ? "border-neutral-500 text-neutral-600 dark:border-neutral-300 dark:text-neutral-200"
                    : "border-transparent text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 hover:dark:text-neutral-300",
                  "whitespace-nowrap rounded-none border-b-2 px-1 py-3 font-medium",
                )}
                aria-current={tab.current ? "page" : undefined}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
