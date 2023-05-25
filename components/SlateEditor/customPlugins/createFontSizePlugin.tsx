import { createPluginFactory } from "@udecode/plate";
import { Text, Transforms } from "slate";
import { MARK_FONT_SIZE } from "@udecode/plate";
// ...

export const CustomFontSizeComponent = ({ attributes, children, leaf }) => {
  const size = leaf.fontSize ? '1.5em' : 'inherit';
  return (
    <span {...attributes} style={{ fontSize: size }}>
      {children}
    </span>
  );
};

// Define the plugin using createPluginFactory
export const createFontSizePlugin = createPluginFactory({
  key: MARK_FONT_SIZE,
  isLeaf: true,
  component: CustomFontSizeComponent,
});


// ...


export const applyFontSize = (editor, isIncreasing) => {
  const { selection } = editor;
  if (selection) {
    if (isIncreasing) {
      Transforms.setNodes(
        editor,
        { [MARK_FONT_SIZE]: true },
        { match: Text.isText, split: true }
      );
    } else {
      Transforms.unsetNodes(
        editor,
        MARK_FONT_SIZE,
        { match: Text.isText, split: true }
      );
    }
  }
};

