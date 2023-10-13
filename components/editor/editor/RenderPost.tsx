import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { generateHTML } from "@tiptap/core";
import { CustomCodeBlock, TiptapExtensions } from "./extensions";
import "highlight.js/styles/monokai-sublime.css";

interface RenderPostProps {
  json: string;
}

const config = { ADD_TAGS: ["iframe"], ADD_ATTR: ["allowfullscreen"] };

const RenderPost = ({ json }: RenderPostProps) => {
  const sanitizedHTML = useMemo(() => {
    const rawHTML = generateHTML(JSON.parse(json), [
      ...TiptapExtensions,
      CustomCodeBlock,
    ]);
    return DOMPurify.sanitize(rawHTML, config);
  }, [json]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};

export default RenderPost;
