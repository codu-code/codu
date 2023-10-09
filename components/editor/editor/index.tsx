"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { TiptapEditorProps } from "./props";
import { TiptapExtensions } from "./extensions";
import { EditorBubbleMenu } from "./components/bubble-menu";
import { MediaResizer } from "./components/image-resizer";
import Toolbar from "./components/Toolbar/Toolbar";

interface EditorProps {
  initialValue: string;
  onChange: (value: string) => void;
}

export default function Editor({ onChange, initialValue }: EditorProps) {
  const editor = useEditor({
    extensions: TiptapExtensions,
    editorProps: TiptapEditorProps,
    content: JSON.parse(initialValue),
    onUpdate: (e) => {
      const { editor } = e;
      const json = editor.getJSON();

      console.log(json);
      onChange(JSON.stringify(json));
    },
    autofocus: "end",
  });

  return (
    <div
      className="relative"
      onClick={() => {
        editor?.chain().focus().run();
      }}
    >
      {editor && <Toolbar editor={editor} />}
      {editor && <MediaResizer editor={editor} />}
      {editor && <EditorBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
