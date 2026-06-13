"use client";

import { forwardRef } from "react";
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize";

/**
 * Auto-growing textarea backing the markdown composer. Stores raw markdown.
 */
type MdTextareaProps = TextareaAutosizeProps & {
  value: string;
  onValueChange: (value: string) => void;
};

export const MdTextarea = forwardRef<HTMLTextAreaElement, MdTextareaProps>(
  function MdTextarea({ value, onValueChange, className = "", ...rest }, ref) {
    return (
      <TextareaAutosize
        ref={ref}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`w-full resize-none border-none bg-transparent text-sm leading-relaxed text-fg outline-none placeholder:text-faint focus:outline-none focus:ring-0 ${className}`}
        {...rest}
      />
    );
  },
);
