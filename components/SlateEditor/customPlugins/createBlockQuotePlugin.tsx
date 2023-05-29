import { createPluginFactory, HotkeyPlugin } from '@udecode/plate-common';
import { Transforms, Editor, Path } from 'slate';

export const ELEMENT_BLOCKQUOTE = 'blockquote';

/**
 * Enables support for block quotes, useful for
 * quotations and passages.
 */
const createBlockquotePlugin = createPluginFactory<HotkeyPlugin>({
  key: ELEMENT_BLOCKQUOTE,
  isElement: true,
  deserializeHtml: {
    rules: [
      {
        validNodeName: 'BLOCKQUOTE',
      },
    ],
  },
  options: {
    hotkey: 'mod+shift+.',
  },
  handlers: {
    onKeyDown: (editor, event) => {
      if (event.key === '.' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();

        // The behavior of the original onKeyDownToggleElement is simplified
        // here for the sake of clarity.
        const isActive = !!Editor.nodes(editor, {
          match: n => n.type === 'blockquote',
        }).length;

        Transforms.setNodes(
          editor,
          { type: isActive ? 'paragraph' : 'blockquote' },
          { match: n => Editor.isBlock(editor, n) }
        );

        const [match] = Editor.nodes(editor, {
          match: n => n.type === 'blockquote',
        });

        if (match) {
          const [node, path] = match;
          // Check if the blockquote is the last node
          if (Editor.isEnd(editor, path)) {
            // Add a new paragraph after the blockquote
            Transforms.insertNodes(
              editor,
              { type: 'paragraph', children: [{ text: '' }] },
              { at: Path.next(path), select: true }
            );
          }
        }
      }
    },
  },
});

export const createCustomBlockquotePlugin = createBlockquotePlugin;
