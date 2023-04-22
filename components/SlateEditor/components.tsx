import React, { Ref, PropsWithChildren } from 'react';

interface BaseProps {
  className: string;
  [key: string]: unknown;
}
type OrNull<T> = T | null;

export const Button = React.forwardRef(
  (
    {
      className,
      active,
      reversed,
      ...props
    }: PropsWithChildren<
      {
        active: boolean;
        reversed: boolean;
      } & BaseProps
    >,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => (
    <span
      {...props}
      ref={ref}
      className={[
        className,
        'cursor-pointer',
        reversed
          ? active
            ? 'text-white'
            : 'text-gray-400'
          : active
          ? 'text-black'
          : 'text-gray-300',
      ].join(' ')}
    />
  )
);

export const Icon = React.forwardRef(
  (
    { className, children, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLSpanElement>>
  ) => (
    <span
      {...props}
      ref={ref}
      className={`material-icons ${className}`} 
    >
      {children}
    </span>
  )
);

  

export const Toolbar = React.forwardRef(
  (
    { className, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <div
      {...props}
      ref={ref}
      className={[
        className,
        'relative',
        'px-4',
        'py-1',
        'border-b-2',
        'border-gray-200',
        'mb-5',
      ].join(' ')}
    />
  )
);
