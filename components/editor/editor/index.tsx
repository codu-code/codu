"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { TiptapEditorProps } from "./props";
import { TiptapExtensions } from "./extensions";
import { EditorBubbleMenu } from "./components/bubble-menu";
import { ImageResizer } from "@/components/editor/editor/components/image-resizer";

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
      onClick={() => {
        editor?.chain().focus().run();
      }}
    >
      {editor && <EditorBubbleMenu editor={editor} />}
      {editor?.isActive("image") && <ImageResizer editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
