import React from "react";
import { FormatBold } from "@styled-icons/material/FormatBold";
import { FormatItalic } from "@styled-icons/material/FormatItalic";
import { FormatUnderlined } from "@styled-icons/material/FormatUnderlined";
import { Link as LinkIcon } from "@styled-icons/material/Link";
import { TextFields, Title } from "@styled-icons/material";

import {
  BalloonToolbar,
  BalloonToolbarProps,
  getPluginType,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  ELEMENT_H4,
  ELEMENT_H3,
  MarkToolbarButton,
  WithPartial,
  usePlateEditorRef,
  LinkToolbarButton,
  BlockToolbarButton,
} from "@udecode/plate";

const HooveringToolbar = (
  props: WithPartial<BalloonToolbarProps, "children">
) => {
  const { children, ...balloonToolbarProps } = props;
  const editor = usePlateEditorRef();
  const arrow = false;
  const theme = "dark";

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
        //@ts-ignore
        tooltip={''}
        icon={<LinkIcon />}
        actionHandler="onMouseDown"
      />
      <BlockToolbarButton
        type={getPluginType(editor, ELEMENT_H3)}
        icon={<Title />}
        actionHandler="onMouseDown"
      />
      <BlockToolbarButton
        type={getPluginType(editor, ELEMENT_H4)}
        icon={<TextFields />}
        actionHandler="onMouseDown"
      />
      {children}
    </BalloonToolbar>
  );
};

export default HooveringToolbar;
