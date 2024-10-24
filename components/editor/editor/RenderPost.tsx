import React from "react";
import { TiptapExtensions } from "./extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import SlashCommand from "./extensions/slash-command";

interface RenderPostProps {
  json: string;
}

const RenderPost = ({ json }: RenderPostProps) => {
  const content = JSON.parse(json);

  const editor = useEditor({
    editable: false,
    extensions: [...TiptapExtensions, SlashCommand],
    content,
  });

  return <EditorContent editor={editor} />;
};

export default RenderPost;
