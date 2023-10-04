import React, { forwardRef, Ref, ForwardRefRenderFunction } from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

interface TextareaAutosizeWrapperProps extends TextareaAutosizeProps {
  inputRef?: Ref<HTMLTextAreaElement>;
}

const TextareaAutosizeWrapper: ForwardRefRenderFunction<
  HTMLTextAreaElement,
  TextareaAutosizeWrapperProps
> = (props, ref) => {
  const { inputRef, ...rest } = props;

  const combinedRef = (node: HTMLTextAreaElement | null) => {
    if (ref) {
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          node;
      }
    }

    if (inputRef) {
      if (typeof inputRef === "function") {
        inputRef(node);
      } else {
        (
          inputRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = node;
      }
    }
  };

  return <TextareaAutosize ref={combinedRef} {...rest} />;
};

export default forwardRef(TextareaAutosizeWrapper);
