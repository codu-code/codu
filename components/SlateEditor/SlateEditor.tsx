import React, { useState, useCallback, useMemo, useEffect } from "react";
import { slateToHtml } from "slate-serializers";
import { sanitize } from "dompurify";
import HooveringToolbar from "./HooveringToolbar";
import {config} from './slateToHTMLConfig'
import {
  createLinkPlugin,
  createBasicElementsPlugin,
  createBlockquotePlugin,
  createBoldPlugin,
  createCodeBlockPlugin,
  createCodePlugin,
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
  // createMediaEmbedPlugin,
  Plate,
  createSoftBreakPlugin,
  createKbdPlugin,
  serializeHtml,
  createPlateEditor,
  usePlateEditorState,
  useEditorRef, usePlateActions, createDeserializeHtmlPlugin
} from "@udecode/plate";
import { createCustomParagraphPlugin } from "./customPlugins/CustomParagraphPlugin";
// import { createLineBreakPlugin } from "./customPlugins/lineBreakPlugin";
import { softBreakPlugin } from "./customPlugins/softBreakPlugin";
import { linkPlugin } from "./customPlugins/linkPlugin";
import { editableProps } from "./editableProps";
import { MyValue } from "./plateTypes";
import { plateUI } from "./plateUI";
import { createFontSizePlugin } from "./customPlugins/createFontSizePlugin";
import { createCustomCodeBlockPlugin } from "./customPlugins/createCustomCodeBlockPlugin";
import { createCustomBlockquotePlugin } from "./customPlugins/createBlockQuotePlugin";
import { createCustomImagePlugin } from "./customPlugins/createCustomImagePlugin";
import { createMediaEmbedPlugin } from "./customPlugins/createCustomMediaPlugin";
const plugins = createPlugins<MyValue>(
  [
    // createParagraphPlugin(),
    createCustomParagraphPlugin({ component: plateUI.CustomParagraphComponent,}),
    // createBlockquotePlugin(),
    createCustomBlockquotePlugin(),
    // createCodeBlockPlugin({
    //   component: plateUI.CodeBlockElement,
    // }),
    // createCodeBlockPlugin(),
    createCustomCodeBlockPlugin({
       component: plateUI.CodeBlockElement,
    }),
    // createFontSizePlugin({ component: plateUI.CustomFontSizeComponent,}),
    createHeadingPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createLinkPlugin(linkPlugin),
    createSoftBreakPlugin(softBreakPlugin),
    // createImagePlugin(),
    createCustomImagePlugin(),
    createMediaEmbedPlugin(),
    createListPlugin(),
    createKbdPlugin(),
    createDeserializeHtmlPlugin(),
    // createBasicElementsPlugin(),
  //  createTodoListPlugin(),
  ],
  {
    components: plateUI,
  }
);



const SlateEditor = ({ onChange: _onChange, initialValue }) => {
  // console.log(linkPlugin)
  const [value, setValue] = useState(initialValue);
  // Instantiate the editor
  // const editor = useMemo(() => createPlateEditor({ plugins }), [plugins]);

  // Get reference to editor
  // const editorRef = useEditorRef();

  // useEffect(() => {
  //   // Set editor reference
  //   editorRef.current = editor;
  // }, [editor]);

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

  // const handleChange = useCallback(
  //   (nextValue) => {
  //     setValue(nextValue);
  //   },
  //   []
  // );

  // const handleChange = useCallback(
  //   (nextValue) => {
  //     setValue(nextValue);
  //     _onChange(JSON.stringify(nextValue));
  //   },
  //   [_onChange]
  // );

//  useEffect(() => {
//     if (editor) {
//       const html = serializeHtml(editor, { nodes: value });
//       console.log(html);
//       _onChange(html);
//     }
//   }, [editor, value, _onChange]);

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
