import { describe, expect, it } from "vitest";
import { renderPostBody } from "./PostBody";

describe("renderPostBody", () => {
  it("renders a tiptap JSON body to sanitized HTML on the server", () => {
    const body = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Read " },
            {
              type: "text",
              text: "this",
              marks: [{ type: "link", attrs: { href: "https://example.com" } }],
            },
            { type: "text", text: " and ", marks: [{ type: "bold" }] },
            { type: "text", text: "that", marks: [{ type: "underline" }] },
          ],
        },
        {
          type: "image",
          attrs: { src: "https://example.com/a.png", alt: "A", width: 640 },
        },
        {
          type: "youtube",
          attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        },
      ],
    });

    const { isTiptap, content } = renderPostBody(body);

    expect(isTiptap).toBe(true);
    expect(content).toContain("<h1>Title</h1>");
    expect(content).toContain('href="https://example.com"');
    expect(content).toContain("<strong> and </strong>");
    expect(content).toContain("<u>that</u>");
    expect(content).toContain('src="https://example.com/a.png"');
    expect(content).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it("strips script content and event handlers from tiptap bodies", () => {
    const body = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "<script>alert(1)</script>" }],
        },
        {
          type: "image",
          attrs: { src: "https://example.com/a.png", onerror: "alert(1)" },
        },
      ],
    });

    const { content } = renderPostBody(body);

    expect(content).not.toContain("<script>");
    expect(content).not.toContain("onerror");
  });

  it("treats a non-JSON body as markdoc source", () => {
    expect(renderPostBody("# Hello").isTiptap).toBe(false);
    expect(renderPostBody(null).isTiptap).toBe(false);
  });
});
