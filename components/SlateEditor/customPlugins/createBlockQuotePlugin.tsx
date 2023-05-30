import { Transforms, Editor, Path } from 'slate';
import {
  createPluginFactory,
  HotkeyPlugin,
  onKeyDownToggleElement,
  getLastChildPath,
  getLastChild
} from '@udecode/plate-common';

export const ELEMENT_BLOCKQUOTE = 'blockquote';

const isLastNodeInEditor = (editor) => {
  const lastChild = getLastChild([editor, []]);
  
  if (lastChild) {
    console.log(lastChild)
    const [lastNode, lastPath] = lastChild;
    return Path.equals(lastPath, Editor.path(editor, []));
  }
  // If no last child found, consider as false
  return false;
};


const withCustomBlockquote = (editor) => {
  console.log('custom block quote')
  const { apply } = editor;

  editor.apply = (operation) => {
    // console.log(operation.type)
    // console.log(operation)
    apply(operation);

    if (operation.type === 'set_node' && operation.newProperties.type === ELEMENT_BLOCKQUOTE) {
      console.log('insert blockquote')

      const emptyNode = { type: 'p', children: [{ text: '' }] };
      const lastChildPath = getLastChildPath([editor, []]);

      if (lastChildPath) {
        Transforms.insertNodes(editor, emptyNode, { at: Path.next(lastChildPath) });
      } else {
        // Fallback if no child node is found
        Transforms.insertNodes(editor, emptyNode);
      }
    }
  }

  return editor;
};


export const createCustomBlockquotePlugin = createPluginFactory<HotkeyPlugin>({
  key: ELEMENT_BLOCKQUOTE,
  isElement: true,
  deserializeHtml: {
    rules: [
      {
        validNodeName: 'BLOCKQUOTE',
      },
    ],
  },
  handlers: {
    onKeyDown: onKeyDownToggleElement,
  },
  options: {
    hotkey: 'mod+shift+.',
  },
  withOverrides: withCustomBlockquote
});
