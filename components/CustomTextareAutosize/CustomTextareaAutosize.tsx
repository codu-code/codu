import type { ForwardRefRenderFunction } from "react";
import React, { forwardRef, useImperativeHandle } from "react";
import type { TextareaAutosizeProps } from "react-textarea-autosize";
import TextareaAutosize from "react-textarea-autosize";

// Simplified wrapper that only uses forwarded ref
const TextareaAutosizeWrapper: ForwardRefRenderFunction<
  HTMLTextAreaElement,
  TextareaAutosizeProps
> = (props, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Use useImperativeHandle to safely expose the ref
  useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement, []);

  return (
    <TextareaAutosize
      ref={(node) => {
        internalRef.current = node;
      }}
      {...props}
    />
  );
};

export default forwardRef(TextareaAutosizeWrapper);
