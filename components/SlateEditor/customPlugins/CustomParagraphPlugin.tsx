import { createPluginFactory, PlatePlugin } from "@udecode/plate";
import { ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import { AddCircleOutline } from "@styled-icons/material";
import { RenderElementProps } from "slate-react";
import { Node } from "slate";
import React, { useState } from "react";
import { useSelected, useFocused } from 'slate-react';
import { useEditorRef } from "@udecode/plate";
import ExpandingToolbar from "./ExpandingMenu";

// Define the custom menu component
export const CustomMenu = ({ editor }) => {
  const [show, setShow] = useState(false);
  const [showPlus, setShowPlus] = useState(true);
  const selected = useSelected();
  const focused = useFocused();

  // Only show the button if this paragraph is currently selected
  if (!selected || !focused) {
    return null;
  }

  // Please ensure you have a check for null and undefined values for editor.selection 
  const top = editor.selection && editor.selection.anchor ? `${editor.selection.anchor.offset * 20}px` : '0px';

  return (
    <div >
      {showPlus && 
        <span
          onClick={() => {
            setShow(!show);
            setShowPlus(false);
          }}
          style={{
            cursor: 'pointer',
          }}
        >
          +
        </span>
      }
      {show && 
        <ExpandingToolbar />
      }
    </div>
  )
}

// Define the custom paragraph component
export const CustomParagraphComponent = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  const editor = useEditorRef();

  if (element.type === ELEMENT_PARAGRAPH && Node.string(element) === '') {
    return (
      <>
      <p {...attributes}>
        <CustomMenu editor={editor} />
        {children}
      </p>
      </>
      
    );
  }

  return <p {...attributes}>{children}</p>;
};

// Define the custom paragraph plugin
export const createCustomParagraphPlugin = (): PlatePlugin =>
  createPluginFactory({
    key: ELEMENT_PARAGRAPH,
    isElement: true,
    // component: CustomParagraphComponent,
  })();
