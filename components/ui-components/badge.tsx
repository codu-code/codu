import * as Headless from "@headlessui/react";
import clsx from "clsx";
import React, { forwardRef } from "react";
import { TouchTarget } from "./button";
import { Link } from "./link";

const colors = {
  red: "bg-danger/12 text-danger group-data-[hover]:bg-danger/20",
  orange: "bg-warning/12 text-warning group-data-[hover]:bg-warning/20",
  amber: "bg-warning/12 text-warning group-data-[hover]:bg-warning/20",
  yellow: "bg-warning/12 text-warning group-data-[hover]:bg-warning/20",
  lime: "bg-success/12 text-success group-data-[hover]:bg-success/20",
  green: "bg-success/12 text-success group-data-[hover]:bg-success/20",
  emerald: "bg-success/12 text-success group-data-[hover]:bg-success/20",
  teal: "bg-success/12 text-success group-data-[hover]:bg-success/20",
  cyan: "bg-info/12 text-info group-data-[hover]:bg-info/20",
  sky: "bg-accent/12 text-accent-soft group-data-[hover]:bg-accent/20",
  blue: "bg-accent/12 text-accent-soft group-data-[hover]:bg-accent/20",
  indigo: "bg-accent/12 text-accent-soft group-data-[hover]:bg-accent/20",
  violet: "bg-info/12 text-info group-data-[hover]:bg-info/20",
  purple: "bg-info/12 text-info group-data-[hover]:bg-info/20",
  fuchsia: "bg-info/12 text-info group-data-[hover]:bg-info/20",
  pink: "bg-accent/12 text-accent-soft group-data-[hover]:bg-accent/20",
  rose: "bg-danger/12 text-danger group-data-[hover]:bg-danger/20",
  zinc: "bg-elevated text-fg group-data-[hover]:bg-hover",
};

type BadgeProps = { color?: keyof typeof colors };

export function Badge({
  color = "zinc",
  className,
  ...props
}: BadgeProps & React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        "inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 forced-colors:outline",
        colors[color],
      )}
    />
  );
}

export const BadgeButton = forwardRef(function BadgeButton(
  {
    color = "zinc",
    className,
    children,
    ...props
  }: BadgeProps & { className?: string; children: React.ReactNode } & (
      | Omit<Headless.ButtonProps, "as" | "className">
      | Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
    ),
  ref: React.ForwardedRef<HTMLElement>,
) {
  const classes = clsx(
    className,
    "group relative inline-flex rounded-md focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-accent",
  );

  return "href" in props ? (
    <Link
      {...props}
      className={classes}
      ref={ref as React.ForwardedRef<HTMLAnchorElement>}
    >
      <TouchTarget>
        <Badge color={color}>{children}</Badge>
      </TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <TouchTarget>
        <Badge color={color}>{children}</Badge>
      </TouchTarget>
    </Headless.Button>
  );
});
