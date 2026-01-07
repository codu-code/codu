import * as Headless from "@headlessui/react";
import NextLink from "next/link";
import React, { forwardRef } from "react";

export const Link = forwardRef(function Link(
  props: { href: string } & React.ComponentPropsWithoutRef<"a">,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const isExternal =
    props.href.startsWith("http") || props.href.startsWith("//");

  if (isExternal) {
    return (
      <Headless.DataInteractive>
        <a {...props} ref={ref} target="_blank" rel="noopener noreferrer" />
      </Headless.DataInteractive>
    );
  }

  return (
    <Headless.DataInteractive>
      <NextLink {...props} ref={ref} />
    </Headless.DataInteractive>
  );
});
