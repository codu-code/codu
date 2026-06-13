import clsx from "clsx";
import { Link } from "./link";

export function Text({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(className, "text-base/6 text-muted sm:text-sm/6")}
    />
  );
}

export function TextLink({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        "text-accent-soft underline decoration-accent-soft/50 data-[hover]:text-accent data-[hover]:decoration-accent",
      )}
    />
  );
}

export function Strong({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"strong">) {
  return (
    <strong {...props} className={clsx(className, "font-medium text-fg")} />
  );
}

export function Code({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  return (
    <code
      {...props}
      className={clsx(
        className,
        "rounded border border-hairline bg-inset px-0.5 text-sm font-medium text-fg sm:text-[0.8125rem]",
      )}
    />
  );
}
