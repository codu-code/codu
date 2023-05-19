import React, { Ref, PropsWithChildren, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom'

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

export const HoveringToolbar = () => {
  const ref = useRef()
  const editor = useSlate()
  const focused = useFocused()
  const [toolbarPosition, setToolbarPosition] = useState({top: -10000, left: -10000})

  useEffect(() => {
    const el = ref.current
    const { selection } = editor

    if (!el) {
      return
    }

    if (!focused || !selection || Range.isCollapsed(selection) || Editor.string(editor, selection) === '') {
      setToolbarPosition({top: -10000, left: -10000})
    } else {
      const domSelection = window.getSelection()
      const domRange = domSelection.getRangeAt(0)
      const rect = domRange.getBoundingClientRect()

      setToolbarPosition({
        top: rect.top + window.pageYOffset - el.offsetHeight,
        left: rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
      })
    }
  }, [focused, editor, editor.selection])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        zIndex: 1,
        ...toolbarPosition,
        marginTop: -6,
        opacity: 1,
        backgroundColor: '#222',
        borderRadius: 4,
        transition: 'opacity 0.75s',
      }}
    >
      <p className="text-white">Hovering Menu</p>
    </div>
  )
}


export const Menu = React.forwardRef(
  (
    { className, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<OrNull<HTMLDivElement>>
  ) => (
    <div
      {...props}
      data-test-id="menu"
      ref={ref}
      className={`${className} space-x-4 inline-block`}
    />
  )
)



export const Portal = ({ children }) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null
}
