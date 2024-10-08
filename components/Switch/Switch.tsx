"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-transparent from-orange-400 to-pink-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-neutral-300 data-[state=checked]:bg-gradient-to-r dark:data-[state=unchecked]:bg-neutral-700 ${className} `}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none ml-[2px] block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
