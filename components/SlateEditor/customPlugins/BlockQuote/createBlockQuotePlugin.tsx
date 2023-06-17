import { Transforms, Path } from "slate";
import {
  createPluginFactory,
  HotkeyPlugin,
  onKeyDownToggleElement,
  getLastChildPath,
} from "@udecode/plate-common";

export const ELEMENT_BLOCKQUOTE = "blockquote";

const withCustomBlockquote = (editor: any) => {
  const { apply } = editor;

  editor.apply = (operation: any) => {
    apply(operation);

    if (
      operation.type === "set_node" &&
      operation.newProperties.type === ELEMENT_BLOCKQUOTE
    ) {

      const emptyNode = { type: "p", children: [{ text: "" }] };
      const lastChildPath = getLastChildPath([editor, []]);

      if (lastChildPath) {
        Transforms.insertNodes(editor, emptyNode, {
          at: Path.next(lastChildPath),
        });
      } else {
        // Fallback if no child node is found
        Transforms.insertNodes(editor, emptyNode);
      }
    }
  };

  return editor;
};

export const createCustomBlockquotePlugin = createPluginFactory<HotkeyPlugin>({
  key: ELEMENT_BLOCKQUOTE,
  isElement: true,
  deserializeHtml: {
    rules: [
      {
        validNodeName: "BLOCKQUOTE",
      },
    ],
  },
  handlers: {
    onKeyDown: onKeyDownToggleElement,
  },
  options: {
    hotkey: "mod+shift+.",
  },
  withOverrides: withCustomBlockquote,
});
