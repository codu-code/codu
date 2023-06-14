import React, { useState, useCallback, useMemo, useEffect } from "react";
import { slateToHtml } from "slate-serializers";
import { sanitize } from "dompurify";
import HooveringToolbar from "./HooveringToolbar";
import {config} from './slateToHTMLConfig'
import {
  createLinkPlugin,
  createBoldPlugin,
  createCodePlugin,
  createHeadingPlugin,
  createItalicPlugin,
  createListPlugin,
  createPlugins,
  createStrikethroughPlugin,
  createUnderlinePlugin,
  Plate,
  createSoftBreakPlugin,
  createKbdPlugin,
} from "@udecode/plate";
import { createCustomParagraphPlugin } from "./customPlugins/CustomParagraphPlugin";
import { softBreakPlugin } from "./customPlugins/softBreakPlugin";
import { linkPlugin } from "./customPlugins/linkPlugin";
import { editableProps } from "./editableProps";
import { MyValue } from "./plateTypes";
import { plateUI } from "./plateUI";
import { createCustomCodeBlockPlugin } from "./customPlugins/createCustomCodeBlockPlugin";
import { createCustomBlockquotePlugin } from "./customPlugins/createBlockQuotePlugin";
import { createCustomImagePlugin } from "./customPlugins/createCustomImagePlugin";
import { createMediaEmbedPlugin } from "./customPlugins/createCustomMediaPlugin";
const plugins = createPlugins<MyValue>(
  [
    createCustomParagraphPlugin({ component: plateUI.CustomParagraphComponent,}),
    createCustomBlockquotePlugin(),
    createCustomCodeBlockPlugin({
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
    createCustomImagePlugin(),
    createMediaEmbedPlugin(),
    createListPlugin(),
    // createKbdPlugin(),
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
      const serializedData = slateToHtml(nextValue, config);
      // console.log(serializedData);
      const sanitizedData = sanitize(serializedData, { ADD_ATTR: ['target'] });
      console.log("saving this: ", sanitizedData);
      _onChange(sanitizedData);
    },
    [_onChange]
  );

  useEffect(() => {
  const iframes = document.querySelectorAll('.remove-padding-from-iframe');
  iframes.forEach((iframe) => {
    const parent = iframe.parentElement;
    if (parent) {
      parent.style.paddingBottom = '10px';
    }
  });
}, []);



  return (
    <>
      <Plate<MyValue>
        editableProps={editableProps}
        initialValue={initialValue}
        plugins={plugins}
        onChange={handleChange}
      >
        <HooveringToolbar />
      </Plate>
    </>
  );
};

export default SlateEditor;
