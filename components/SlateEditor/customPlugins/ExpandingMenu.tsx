import React from 'react';
import { Toolbar, ToolbarProps, WithPartial } from '@udecode/plate';
import { getPluginType, usePlateEditorRef, MARK_BOLD, MarkToolbarButton,
  LinkToolbarButton,
  ToolbarButton,
  ELEMENT_IMAGE,
  ELEMENT_MEDIA_EMBED,
  ELEMENT_OL,
  ELEMENT_UL,
  BlockToolbarButton,
  CodeBlockToolbarButton,
  ELEMENT_BLOCKQUOTE,
  ImageToolbarButton,
  ListToolbarButton,
  MediaEmbedToolbarButton, } from '@udecode/plate';
import { FormatQuote } from "@styled-icons/material";
import { Code } from "@styled-icons/material";
import { Image } from '@styled-icons/material/Image';
import { FormatListBulleted } from '@styled-icons/material/FormatListBulleted';
import { FormatListNumbered } from '@styled-icons/material/FormatListNumbered';
import { OndemandVideo } from '@styled-icons/material/OndemandVideo';

const ExpandingToolbar = (props: WithPartial<ToolbarProps, 'children'>) => {
  const { children, ...toolbarProps } = props;
const editor = usePlateEditorRef();
  return (
    <Toolbar  
      style={{
    backgroundColor: "rgb(23 23 23 / var(--tw-bg-opacity))",
    color: "#ffffff",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    borderRadius: "4px"
  }}>
    <BlockToolbarButton
        type={getPluginType(editor, ELEMENT_BLOCKQUOTE)}
        icon={<FormatQuote />}
        actionHandler="onMouseDown"
      />
      <CodeBlockToolbarButton icon={<Code />} actionHandler="onMouseDown" tooltip={null}/>
      <ImageToolbarButton icon={<Image />} />
      <MediaEmbedToolbarButton icon={<OndemandVideo />} />
      <ListToolbarButton
        type={getPluginType(editor, ELEMENT_UL)}
        icon={<FormatListBulleted />}
      />
      <ListToolbarButton
        type={getPluginType(editor, ELEMENT_OL)}
        icon={<FormatListNumbered />}
      />
    </Toolbar>
  );
};

export default ExpandingToolbar;
