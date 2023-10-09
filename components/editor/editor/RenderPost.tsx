import React, { useMemo } from "react";
import DOMPurify, { Config } from "dompurify";
import { generateHTML } from "@tiptap/core";
import { TiptapExtensions } from "./extensions";
import "highlight.js/styles/monokai-sublime.css";

interface RenderPostProps {
  json: string;
}

const config: Config = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allowfullscreen", "target"],
};

const RenderPost = ({ json }: RenderPostProps) => {
  const sanitizedHTML = useMemo(() => {
    const rawHTML = generateHTML(JSON.parse(json), [...TiptapExtensions]);
    return DOMPurify.sanitize(rawHTML, config) as string;
  }, [json]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};

export default RenderPost;
