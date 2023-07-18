import { BookOpenIcon, CheckCircleIcon } from "@heroicons/react/outline";
import clsx from "clsx";

export interface IContent {
  title: string;
  completed?: boolean;
}

interface CourseContensProps {
  title: string;
  contents: IContent[];
}

export const CourseContens = ({ title, contents }: CourseContensProps) => {
  return (
    <div className="bg-neutral-900">
      <div className="p-4 border-b border-neutral-500">
        <p className="text-lg font-semibold leading-none">{title}</p>
      </div>

      <div className="p-4">
        <ul className="flex flex-col gap-4">
          {contents.map((c) => (
            <li key={c.title} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpenIcon className="w-6" />
                <p className="font-medium">{c.title}</p>
              </div>
              <CheckCircleIcon
                className={clsx("w-6", {
                  "text-pink-600": c.completed,
                })}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
