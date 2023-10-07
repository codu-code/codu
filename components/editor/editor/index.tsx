"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { TiptapEditorProps } from "./props";
import { TiptapExtensions } from "./extensions";
import { EditorBubbleMenu } from "./components/bubble-menu";
import { ImageResizer } from "@/components/editor/editor/components/image-resizer";
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
      <Toolbar />
      {editor && <EditorBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
