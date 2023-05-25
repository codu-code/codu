import React from 'react';
import { FormatBold } from '@styled-icons/material/FormatBold';
import { FormatItalic } from '@styled-icons/material/FormatItalic';
import { FormatUnderlined } from '@styled-icons/material/FormatUnderlined';
import { FormatSize } from '@styled-icons/material';
import { Link as LinkIcon } from '@styled-icons/material/Link';
import { Editor } from 'slate';
import {
  BalloonToolbar,
  BalloonToolbarProps,
  getPluginType,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  MARK_FONT_SIZE,
  ELEMENT_LINK,
  MarkToolbarButton,
  WithPartial,
  usePlateEditorRef,
  LinkToolbarButton,
  ToolbarButton
  // UseVirtualFloatingOptions
} from '@udecode/plate';
import { applyFontSize } from './customPlugins/createFontSizePlugin';

const HooveringToolbar = (
  props: WithPartial<BalloonToolbarProps, 'children'>
) => {
  const { children, ...balloonToolbarProps } = props;
  // console.log('my props ', balloonToolbarProps)

  const editor = usePlateEditorRef();

  const arrow = false;
  const theme = 'dark';

  

  // TODO: Define positioning of the toolbar and pass into BallonToolbar as floatingOptions={floatingOptions}
  // const floatingOptions: UseVirtualFloatingOptions = {
  //   getBoundingClientRect: () => ({
  //     width: 0,
  //     height: 0,
  //     top: 0,    
  //     right: 0, 
  //     bottom: 0,
  //     left: 0,   
  //   }),
  // };
  
  return (
    <BalloonToolbar theme={theme} arrow={arrow} {...balloonToolbarProps}>
      <MarkToolbarButton
        type={getPluginType(editor, MARK_BOLD)}
        icon={<FormatBold />}
        actionHandler="onMouseDown"
      />
      <MarkToolbarButton
        type={getPluginType(editor, MARK_ITALIC)}
        icon={<FormatItalic />}
        actionHandler="onMouseDown"
      />
      <MarkToolbarButton
        type={getPluginType(editor, MARK_UNDERLINE)}
        icon={<FormatUnderlined />}
        actionHandler="onMouseDown"
      />
      <LinkToolbarButton
        // type={getPluginType(editor, ELEMENT_LINK)}
        icon={<LinkIcon />}
        actionHandler="onMouseDown"
      />
      <ToolbarButton
  icon={<FormatSize />}
  onMouseDown={(event) => {
    event.preventDefault();

    const nodes = Array.from(
      Editor.nodes(editor, {
        at: editor.selection || undefined,
        match: Text.isText,
      })
    );

    const isFontSizeIncreased = nodes.some(([node]) => node.fontSize === '1.2em');

    // Call applyFontSize with the desired action
    applyFontSize(editor, !isFontSizeIncreased);
  }}
/>

      {children}
    </BalloonToolbar>
  );
};

export default HooveringToolbar