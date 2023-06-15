import React, { useState, useCallback, useMemo, useEffect } from "react";
import { slateToHtml } from "slate-serializers";
// @ts-ignore
import { sanitize } from "dompurify";
import HooveringToolbar from "../Components/HooveringToolbar";
const { config } = require('../Config/slateToHTMLConfig');
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
import { createCustomParagraphPlugin } from "../customPlugins/Paragraph/CustomParagraphPlugin";
import { softBreakPlugin } from "../customPlugins/Linebreaks/softBreakPlugin";
import { linkPlugin } from "../customPlugins/Link/linkPlugin";
import { editableProps } from "./Settings/editableProps";
import { MyValue } from "./Settings/plateTypes";
import { plateUI } from "./Settings/plateUI";
import { createCustomCodeBlockPlugin } from "../customPlugins/CodeBlock/createCustomCodeBlockPlugin";
import { createCustomBlockquotePlugin } from "../customPlugins/BlockQuote/createBlockQuotePlugin";
import { createCustomImagePlugin } from "../customPlugins/Image/createCustomImagePlugin";
import { createMediaEmbedPlugin } from "../customPlugins/Media/createCustomMediaPlugin";
const plugins = createPlugins<MyValue>(
  [
    // @ts-ignore
    createCustomParagraphPlugin({ component: plateUI.CustomParagraphComponent,}),
    createCustomBlockquotePlugin(),
    createCustomCodeBlockPlugin({
    // @ts-ignore
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



const SlateEditor = ({ onChange: _onChange, initialValue }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, initialValue: any }) => {
  // your component's implementation

  const [value, setValue] = useState(initialValue);
  
  const handleChange = useCallback(
    (nextValue: any) => {
      setValue(nextValue);
      console.log(nextValue);
      const serializedData = slateToHtml(nextValue, config);

      const sanitizedData = sanitize(serializedData, {
  ADD_TAGS: ["iframe"], 
  ADD_ATTR: [
    'allowfullscreen', 
    'allow', 
    'frameborder', 
    'scrolling', 
    'target', 
    'accelerometer', 
    'autoplay', 
    'clipboard-write', 
    'encrypted-media', 
    'gyroscope', 
    'picture-in-picture'
  ]
});
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
        // @ts-ignore
        plugins={plugins}
        onChange={handleChange}
      >
        <HooveringToolbar />
      </Plate>
    </>
  );
};

export default SlateEditor;
