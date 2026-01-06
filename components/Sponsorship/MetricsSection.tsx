import {
  UsersIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const metrics = [
  {
    label: "Community Members",
    value: "4,000+",
    icon: UsersIcon,
  },
  {
    label: "Monthly Website Visits",
    value: "20,000+",
    icon: GlobeAltIcon,
  },
  {
    label: "Social Media Reach",
    value: "30,000+",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    label: "Events Per Year",
    value: "12+",
    icon: CalendarDaysIcon,
  },
];

export function MetricsSection() {
  return (
    <section className="border-y border-neutral-800 bg-black py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Your Audience Awaits
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <metric.icon className="mx-auto h-8 w-8 text-orange-400" />
              <p className="mt-4 text-3xl font-bold text-white lg:text-4xl">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-neutral-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
