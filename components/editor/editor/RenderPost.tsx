import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { generateHTML } from "@tiptap/core";
import { TiptapExtensions } from "./extensions";

interface RenderPostProps {
  json: string;
}

const config = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allowfullscreen", "target"],
};

const RenderPost = ({ json }: RenderPostProps) => {
  const sanitizedHTML = useMemo(() => {
    const rawHTML = generateHTML(JSON.parse(json), [...TiptapExtensions]);
    return DOMPurify.sanitize(rawHTML, config);
  }, [json]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};

export default RenderPost;
