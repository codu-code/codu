"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import { Button } from "./button";
import { Link } from "./link";

export function Dropdown(props: Headless.MenuProps) {
  return <Headless.Menu {...props} />;
}

export function DropdownButton<T extends React.ElementType = typeof Button>({
  as = Button,
  ...props
}: { className?: string } & Omit<Headless.MenuButtonProps<T>, "className">) {
  return <Headless.MenuButton as={as} {...props} />;
}

export function DropdownMenu({
  anchor = "bottom",
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuItemsProps, "as" | "className">) {
  return (
    <Headless.MenuItems
      {...props}
      transition
      anchor={anchor}
      className={clsx(
        className,
        // Anchor positioning
        "[--anchor-gap:theme(spacing.2)] [--anchor-padding:theme(spacing.1)] data-[anchor~=start]:[--anchor-offset:-6px] data-[anchor~=end]:[--anchor-offset:6px] sm:data-[anchor~=start]:[--anchor-offset:-4px] sm:data-[anchor~=end]:[--anchor-offset:4px]",
        // Base styles
        "isolate w-max rounded-xl p-1",
        // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
        "outline outline-1 outline-transparent focus:outline-none",
        // Handle scrolling when menu won't fit in viewport
        "overflow-y-auto",
        // Popover background
        "bg-elevated/90 backdrop-blur-xl",
        // Shadows
        "shadow-lg ring-1 ring-inset ring-hairline",
        // Define grid at the menu level if subgrid is supported
        "supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]",
        // Transitions
        "transition data-[closed]:data-[leave]:opacity-0 data-[leave]:duration-100 data-[leave]:ease-in",
      )}
    />
  );
}

export function DropdownItem({
  className,
  ...props
}: { className?: string } & (
  | Omit<React.ComponentPropsWithoutRef<"button">, "as" | "className">
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
)) {
  const classes = clsx(
    className,
    // Base styles
    "group cursor-default rounded-lg px-3.5 py-2.5 focus:outline-none sm:px-3 sm:py-1.5",
    // Text styles
    "text-left text-base/6 text-fg sm:text-sm/6 forced-colors:text-[CanvasText]",
    // Focus
    "data-[focus]:bg-accent data-[focus]:text-on-accent",
    // Disabled state
    "data-[disabled]:opacity-50",
    // Forced colors mode
    "forced-color-adjust-none forced-colors:data-[focus]:bg-[Highlight] forced-colors:data-[focus]:text-[HighlightText] forced-colors:[&>[data-slot=icon]]:data-[focus]:text-[HighlightText]",
    // Use subgrid when available but fallback to an explicit grid layout if not
    "col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid",
    // Icons
    "[&>[data-slot=icon]]:col-start-1 [&>[data-slot=icon]]:row-start-1 [&>[data-slot=icon]]:-ml-0.5 [&>[data-slot=icon]]:mr-2.5 [&>[data-slot=icon]]:size-5 sm:[&>[data-slot=icon]]:mr-2 [&>[data-slot=icon]]:sm:size-4",
    "[&>[data-slot=icon]]:text-muted [&>[data-slot=icon]]:data-[focus]:text-on-accent",
    // Avatar
    "[&>[data-slot=avatar]]:-ml-1 [&>[data-slot=avatar]]:mr-2.5 [&>[data-slot=avatar]]:size-6 sm:[&>[data-slot=avatar]]:mr-2 sm:[&>[data-slot=avatar]]:size-5",
  );

  return (
    <Headless.MenuItem>
      {"href" in props ? (
        <Link {...props} className={classes} />
      ) : (
        <button type="button" {...props} className={classes} />
      )}
    </Headless.MenuItem>
  );
}

export function DropdownHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={clsx(className, "col-span-5 px-3.5 pb-1 pt-2.5 sm:px-3")}
    />
  );
}

export function DropdownSection({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuSectionProps,
  "as" | "className"
>) {
  return (
    <Headless.MenuSection
      {...props}
      className={clsx(
        className,
        // Define grid at the section level instead of the item level if subgrid is supported
        "col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]",
      )}
    />
  );
}

export function DropdownHeading({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuHeadingProps,
  "as" | "className"
>) {
  return (
    <Headless.MenuHeading
      {...props}
      className={clsx(
        className,
        "col-span-full grid grid-cols-[1fr,auto] gap-x-12 px-3.5 pb-1 pt-2 text-sm/5 font-medium text-muted sm:px-3 sm:text-xs/5",
      )}
    />
  );
}

export function DropdownDivider({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuSeparatorProps,
  "as" | "className"
>) {
  return (
    <Headless.MenuSeparator
      {...props}
      className={clsx(
        className,
        "col-span-full mx-3.5 my-1 h-px border-0 bg-hairline sm:mx-3 forced-colors:bg-[CanvasText]",
      )}
    />
  );
}

export function DropdownLabel({
  className,
  ...props
}: { className?: string } & Omit<Headless.LabelProps, "as" | "className">) {
  return (
    <Headless.Label
      {...props}
      data-slot="label"
      className={clsx(className, "col-start-2 row-start-1")}
      {...props}
    />
  );
}

export function DropdownDescription({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DescriptionProps,
  "as" | "className"
>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={clsx(
        className,
        "col-span-2 col-start-2 row-start-2 text-sm/5 text-muted group-data-[focus]:text-on-accent sm:text-xs/5 forced-colors:group-data-[focus]:text-[HighlightText]",
      )}
    />
  );
}

export function DropdownShortcut({
  keys,
  className,
  ...props
}: { keys: string | string[]; className?: string } & Omit<
  Headless.DescriptionProps<"kbd">,
  "as" | "className"
>) {
  return (
    <Headless.Description
      as="kbd"
      {...props}
      className={clsx(
        className,
        "col-start-5 row-start-1 flex justify-self-end",
      )}
    >
      {(Array.isArray(keys) ? keys : keys.split("")).map((char, index) => (
        <kbd
          key={index}
          className={clsx([
            "min-w-[2ch] text-center font-sans capitalize text-faint group-data-[focus]:text-on-accent forced-colors:group-data-[focus]:text-[HighlightText]",
            // Make sure key names that are longer than one character (like "Tab") have extra space
            index > 0 && char.length > 1 && "pl-1",
          ])}
        >
          {char}
        </kbd>
      ))}
    </Headless.Description>
  );
}
