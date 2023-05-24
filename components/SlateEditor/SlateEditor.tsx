import React, { useState, useCallback } from "react";
import { slateToHtml } from "slate-serializers";
import { sanitize } from "dompurify";
import HooveringToolbar from "./HooveringToolbar";

import {
  createBlockquotePlugin,
  createBoldPlugin,
  createCodeBlockPlugin,
  createCodePlugin,
  createHeadingPlugin,
  createItalicPlugin,
  createParagraphPlugin,
  createPlugins,
  createStrikethroughPlugin,
  createUnderlinePlugin,
  Plate,
} from "@udecode/plate";
import { createCustomParagraphPlugin } from "./customPlugins/CustomParagraphPlugin";
import { editableProps } from "./editableProps";
import { MyValue } from "./plateTypes";
import { plateUI } from "./plateUI";

const plugins = createPlugins<MyValue>(
  [
    createParagraphPlugin(),
    // createCustomParagraphPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin({
      component: plateUI.CodeBlockElement,
    }),
    createHeadingPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
  ],
  {
    components: plateUI,
  }
);

const SlateEditor = ({ onChange: _onChange, initialValue }) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback(
    (nextValue) => {
      setValue(nextValue);
      console.log(nextValue);
      const serializedData = slateToHtml(nextValue);
      console.log(serializedData);
      const sanitizedData = sanitize(serializedData);
      console.log("saving this: ", sanitizedData);
      _onChange(sanitizedData);
    },
    [_onChange]
  );

  return (
    <>
      <Plate<MyValue>
        editableProps={editableProps}
        initialValue={initialValue}
        plugins={plugins}
        onChange={handleChange}
        // value={value}
      >
        <HooveringToolbar />
      </Plate>
    </>
  );
};

export default SlateEditor;
