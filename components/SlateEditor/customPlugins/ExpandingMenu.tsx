import React from 'react';
import { Toolbar, ToolbarProps, WithPartial } from '@udecode/plate';
import { MarkToolbarButton, getPluginType, usePlateEditorRef, MARK_BOLD } from '@udecode/plate';
import { FormatBold } from '@styled-icons/material';

const ExpandingToolbar = (props: WithPartial<ToolbarProps, 'children'>) => {
  const { children, ...toolbarProps } = props;
const editor = usePlateEditorRef();
  return (
    <Toolbar {...toolbarProps}>
      <MarkToolbarButton
        type={getPluginType(editor, MARK_BOLD)}
        icon={<FormatBold />}
        actionHandler="onMouseDown"
      />
    </Toolbar>
  );
};

export default ExpandingToolbar;
