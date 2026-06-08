import clsx from "clsx";

export function DescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dl">) {
  return (
    <dl
      {...props}
      className={clsx(
        className,
        "grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,theme(spacing.80))_auto] sm:text-sm/6",
      )}
    />
  );
}

export function DescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dt">) {
  return (
    <dt
      {...props}
      className={clsx(
        className,
        "col-start-1 border-t border-hairline pt-3 text-muted first:border-none sm:border-t sm:border-hairline sm:py-3",
      )}
    />
  );
}

export function DescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dd">) {
  return (
    <dd
      {...props}
      className={clsx(
        className,
        "pb-3 pt-1 text-fg sm:border-t sm:border-hairline sm:py-3 sm:[&:nth-child(2)]:border-none",
      )}
    />
  );
}
