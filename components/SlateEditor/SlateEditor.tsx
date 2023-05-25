import React, { useState, useCallback } from "react";
import { slateToHtml } from "slate-serializers";
import { sanitize } from "dompurify";
import HooveringToolbar from "./HooveringToolbar";
import {config} from './slateToHTMLConfig'
import {
  createLinkPlugin,
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
  PlateFloatingLink,
  SoftBreakPlugin,
  Plate,
  createSoftBreakPlugin,
} from "@udecode/plate";
// import { createCustomParagraphPlugin } from "./customPlugins/CustomParagraphPlugin";
// import { createLineBreakPlugin } from "./customPlugins/lineBreakPlugin";
import { softBreakPlugin } from "./customPlugins/softBreakPlugin";
import { linkPlugin } from "./customPlugins/linkPlugin";
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
    createLinkPlugin(linkPlugin),
    createSoftBreakPlugin(softBreakPlugin),
  ],
  {
    components: plateUI,
  }
);

const SlateEditor = ({ onChange: _onChange, initialValue }) => {
  // console.log(linkPlugin)
  const [value, setValue] = useState(initialValue);


  const handleChange = useCallback(
    (nextValue) => {
      setValue(nextValue);
      // console.log(nextValue);
      const serializedData = slateToHtml(nextValue, config);
      // console.log(serializedData);
      const sanitizedData = sanitize(serializedData, { ADD_ATTR: ['target'] });
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
