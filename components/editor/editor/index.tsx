"use client";

import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TiptapEditorProps } from "./props";
import { CustomCodeBlockEdit, TiptapExtensions } from "./extensions";
import { EditorBubbleMenu } from "./components/bubble-menu";
import { MediaResizer } from "./components/image-resizer";
import Toolbar from "./components/Toolbar/Toolbar";

interface EditorProps {
  initialValue: string;
  onChange: (value: string) => void;
}

export default function Editor({ onChange, initialValue }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography],
    editorProps: TiptapEditorProps,
    content: JSON.parse(initialValue),
    onUpdate: (e) => {
      const { editor } = e;
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
    autofocus: "end",
  });

  return (
    // TODO: Review this for no-static-element-interactions click-events-have-key-events
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="relative"
      onClick={() => {
        editor?.chain().focus().run();
      }}
    >
      {editor && <Toolbar editor={editor} />}
      {editor && <MediaResizer editor={editor} />}
      {editor && (
        <EditorBubbleMenu editor={editor} className="p-1 font-extrabold" />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
