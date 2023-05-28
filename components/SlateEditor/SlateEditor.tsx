import React, { useState, useCallback } from "react";
import { slateToHtml } from "slate-serializers";
import { sanitize } from "dompurify";
import HooveringToolbar from "./HooveringToolbar";
import {config} from './slateToHTMLConfig'
import { CustomFontSizeComponent } from "./customPlugins/createFontSizePlugin";
import ExpandingToolbar from "./customPlugins/ExpandingMenu";
import {
  createLinkPlugin,
  createBlockquotePlugin,
  createBoldPlugin,
  createCodeBlockPlugin,
  createCodePlugin,
  // createFontSizePlugin,
  createHeadingPlugin,
  createItalicPlugin,
   createListPlugin,
   createTodoListPlugin,
  createParagraphPlugin,
  createPlugins,
  createStrikethroughPlugin,
  createUnderlinePlugin,
  PlateFloatingLink,
  SoftBreakPlugin,
  createImagePlugin,
  createMediaEmbedPlugin,
  Plate,
  createSoftBreakPlugin,
  createKbdPlugin,
} from "@udecode/plate";
import { createCustomParagraphPlugin } from "./customPlugins/CustomParagraphPlugin";
// import { createLineBreakPlugin } from "./customPlugins/lineBreakPlugin";
import { softBreakPlugin } from "./customPlugins/softBreakPlugin";
import { linkPlugin } from "./customPlugins/linkPlugin";
import { editableProps } from "./editableProps";
import { MyValue } from "./plateTypes";
import { plateUI } from "./plateUI";
import { createFontSizePlugin } from "./customPlugins/createFontSizePlugin";

const plugins = createPlugins<MyValue>(
  [
    // createParagraphPlugin(),
    createCustomParagraphPlugin({ component: plateUI.CustomParagraphComponent,}),
    createBlockquotePlugin(),
    createCodeBlockPlugin({
      component: plateUI.CodeBlockElement,
    }),
    createFontSizePlugin({ component: plateUI.CustomFontSizeComponent,}),
    createHeadingPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createLinkPlugin(linkPlugin),
    createSoftBreakPlugin(softBreakPlugin),
    createImagePlugin(),
    createMediaEmbedPlugin(),
    createListPlugin(),
    createKbdPlugin(),
   createTodoListPlugin(),
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
      console.log(nextValue);
      // const serializedData = slateToHtml(nextValue, config);
      // console.log(serializedData);
      // const sanitizedData = sanitize(serializedData, { ADD_ATTR: ['target'] });
      // console.log("saving this: ", sanitizedData);
      _onChange(JSON.stringify(nextValue));
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
