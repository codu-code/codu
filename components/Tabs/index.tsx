function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface Tab {
  id: string;
  title: string;
  subtitle?: string;
}

interface TabProps {
  tabs: Tab[];
  selectedTab: string;
  onTabSelected: (tab: string) => void;
}

export function Tabs(props: TabProps) {
  const { tabs, selectedTab, onTabSelected } = props;
  return (
    <div className="max-w-5xl pb-4">
      <div className="flex flex-row">
        {tabs.map((tab) => (
          <button
            key={tab.title}
            onClick={() => onTabSelected(tab.id)}
            className={classNames(
              tab.id === selectedTab ? "border-b-2 border-b-white-600" : "",
              "text-2xl tracking-tight font-extrabold text-neutral-50 pb-2 mr-8"
            )}
          >
            {tab.title} <span className="font-light">{tab.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
