import React from "react";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";
import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/core";
import sanitizeHtml from "sanitize-html";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { RenderExtensions } from "@/components/editor/editor/extensions/render-extensions";

// A post body is either tiptap JSON (newer editor) or markdoc source. Both the
// public reader and the admin moderation preview render it through here, so a
// moderator approving a post is looking at the same output readers will get.

const parseJSON = (str: string): JSONContent | null => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const renderSanitizedTiptapContent = (jsonContent: JSONContent) => {
  const rawHtml = generateHTML(jsonContent, [...RenderExtensions]);
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "iframe",
      "h1",
      "h2",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "class"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen"],
      "*": ["class", "id", "style"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
    ],
  });
};

export function renderPostBody(body: string | null): {
  isTiptap: boolean;
  content: string | RenderableTreeNode;
} {
  const source = body ?? "";
  const parsed = parseJSON(source);

  if (parsed?.type === "doc") {
    return { isTiptap: true, content: renderSanitizedTiptapContent(parsed) };
  }

  return {
    isTiptap: false,
    content: Markdoc.transform(Markdoc.parse(source), config),
  };
}

/**
 * The rendered body only. The heading is the caller's business: the reader
 * prints the title above markdoc bodies (tiptap bodies carry their own H1),
 * and the admin preview always shows its own header.
 *
 * `emptyFallback` covers a tiptap body that parses but renders to nothing. What
 * to show there depends on the surface — the public reader treats it as a
 * missing page, the moderation preview as an empty submission — so the caller
 * decides rather than this component hardcoding a full-page 404.
 */
export const PostBody = ({
  isTiptap,
  content,
  emptyFallback = null,
}: ReturnType<typeof renderPostBody> & { emptyFallback?: React.ReactNode }) => {
  if (isTiptap) {
    return content ? (
      <div
        dangerouslySetInnerHTML={{ __html: content as string }}
        className="tiptap-content"
      />
    ) : (
      emptyFallback
    );
  }

  return (
    <div>
      {Markdoc.renderers.react(content, React, {
        components: markdocComponents,
      })}
    </div>
  );
};
