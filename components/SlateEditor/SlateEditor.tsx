import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { slateToHtml } from 'slate-serializers'
import { Button, Icon, Menu, Portal } from './components'
import {sanitize} from 'dompurify'

import {
  createBlockquotePlugin,
  createBoldPlugin,
  createCodeBlockPlugin,
  createCodePlugin,
  createHeadingPlugin,
  createItalicPlugin,
  createParagraphPlugin,
  createPlugins,
  createStrikethroughPlugin,
  createUnderlinePlugin,
  Plate,
  resetEditorChildren
} from '@udecode/plate';
import { createCustomParagraphPlugin } from './customPlugins/CustomParagraphPlugin';
import { editableProps } from './editableProps';
import { MyValue } from './plateTypes';
import { plateUI } from './plateUI';

const plugins = createPlugins<MyValue>(
    [
      createParagraphPlugin(),
      // createCustomParagraphPlugin(),
      createBlockquotePlugin(),
      createCodeBlockPlugin({
        component: plateUI.CodeBlockElement,
      }),
      createHeadingPlugin(),
      createBoldPlugin(),
      createItalicPlugin(),
      createUnderlinePlugin(),
      createStrikethroughPlugin(),
      createCodePlugin(),
    ],
    {
      components: plateUI,
    }
  );

const SlateEditor = ({onChange: _onChange, initialValue}) => {
  const [value, setValue] = useState(initialValue);
  // console.log('initial: ', value)
//   useEffect(() => {
//     setValue(initialValue)
//   console.log('initialValue changed:', initialValue);
// }, [initialValue]);

const handleChange = useCallback((nextValue) => {
  setValue(nextValue);
  console.log(nextValue)
  const serializedData = slateToHtml(nextValue)
  console.log(serializedData)
  const sanitizedData = sanitize(serializedData)
  console.log('saving this: ', sanitizedData)
  _onChange(sanitizedData);
}, [_onChange]);

  return (
    <>
    <Plate<MyValue>
    editableProps={editableProps}
    initialValue={initialValue}
    plugins={plugins}
    onChange={handleChange}
    // value={value}
  />
    {/* <Slate editor={editor} value={initialValue} onChange={handleChange}>
      <HoveringToolbar />
      <Editable
        className="text-xl leading-5 bg-neutral-900 focus:bg-black mt-4 focus:ring-2 focus:ring-gray-300 py-3 px-2 min-h-[40rem]"
        renderLeaf={props => <Leaf {...props} />}
        placeholder="Enter some text..."
        onDOMBeforeInput={(event: InputEvent) => {
          switch (event.inputType) {
            case 'formatBold':
              event.preventDefault()
              return toggleFormat(editor, 'bold')
            case 'formatItalic':
              event.preventDefault()
              return toggleFormat(editor, 'italic')
            case 'formatUnderline':
              event.preventDefault()
              return toggleFormat(editor, 'underline')
          }
        }}
      />
    </Slate> */}
    </>
    
  )
}

// const toggleFormat = (editor, format) => {
//   const isActive = isFormatActive(editor, format)
//   Transforms.setNodes(
//     editor,
//     { [format]: isActive ? null : true },
//     { match: Text.isText, split: true }
//   )
// }

// const isFormatActive = (editor, format) => {
//   const [match] = Editor.nodes(editor, {
//     match: n => n[format] === true,
//     mode: 'all',
//   })
//   return !!match
// }

// const Leaf = ({ attributes, children, leaf }) => {
//   if (leaf.bold) {
//     children = <strong>{children}</strong>
//   }

//   if (leaf.italic) {
//     children = <em>{children}</em>
//   }

//   if (leaf.underline) {
//     children = <u>{children}</u>
//   }

//   return <span {...attributes}>{children}</span>
// }

// const HoveringToolbar = () => {
//   const ref = useRef<HTMLDivElement | null>()
//   const editor = useSlate()
//   const inFocus = useFocused()

//   useEffect(() => {
//     const el = ref.current
//     const { selection } = editor

//     if (!el) {
//       return
//     }

//     if (
//       !selection ||
//       !inFocus ||
//       Range.isCollapsed(selection) ||
//       Editor.string(editor, selection) === ''
//     ) {
//       el.removeAttribute('style')
//       return
//     }

//     const domSelection = window.getSelection()
//     const domRange = domSelection.getRangeAt(0)
//     const rect = domRange.getBoundingClientRect()
//     el.style.opacity = '1'
//     el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
//     el.style.left = `${rect.left +
//       window.pageXOffset -
//       el.offsetWidth / 2 +
//       rect.width / 2}px`
//   })

//   return (
//     <Portal>
//       <Menu
//   ref={ref}
//   className="p-2 absolute top-0 left-0 mt-[-6px] opacity-0 bg-black rounded transition-opacity duration-700 z-10"
//   onMouseDown={e => {
//     // prevent toolbar from taking focus away from editor
//     e.preventDefault()
//   }}
// >
//   <FormatButton format="bold" icon="format_bold" />
//   <FormatButton format="italic" icon="format_italic" />
//   <FormatButton format="underline" icon="format_underlined" />
// </Menu>
//     </Portal>
//   )
// }

// const FormatButton = ({ format, icon }) => {
//   const editor = useSlate()
//   return (
//     <Button
//       reversed
//       active={isFormatActive(editor, format)}
//       onClick={() => toggleFormat(editor, format)}
//     >
//       <Icon>{icon}</Icon>
//     </Button>
//   )
// }

export default SlateEditor