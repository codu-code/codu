import React from "react";
import { TiptapExtensions } from "./extensions";
import { EditorContent, useEditor } from "@tiptap/react";

interface RenderPostProps {
  json: string;
}

const RenderPost = ({ json }: RenderPostProps) => {
  const content = JSON.parse(json);

  const editor = useEditor({
    editable: false,
    extensions: [...TiptapExtensions],
    content,
  });

  return <EditorContent editor={editor} />;
};

export default RenderPost;
