import { describe, it, expect } from "vitest";
import { getDiscussionForumPostingSchema } from "./discussion-forum-posting";

const baseInput = {
  title: "What's your actual agent stack in production right now?",
  body: "I'm curious what people are <strong>actually</strong> running.",
  excerpt: "I'm curious what people are actually running.",
  slug: "whats-your-actual-agent-stack-sicu7k8",
  publishedAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-02T12:00:00.000Z",
  upvotes: 7,
  author: {
    name: "Niall Maher",
    username: "niall-maher-p13",
    image: "https://example.com/niall.png",
    bio: "Founder of Codú",
  },
  comments: [
    {
      id: "c1",
      body: "We run LangGraph + Bedrock.",
      createdAt: "2026-05-01T11:00:00.000Z",
      author: { name: "Ada", username: "ada-l" },
    },
    {
      id: "c2",
      body: "Mostly raw tool-calls, no framework.",
      createdAt: "2026-05-01T12:00:00.000Z",
      author: { name: "Linus", username: "linus-t" },
    },
  ],
};

describe("getDiscussionForumPostingSchema", () => {
  it("emits @type DiscussionForumPosting with @context", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("DiscussionForumPosting");
    expect(schema.headline).toBe(baseInput.title);
  });

  it("sets mainEntityOfPage to the /d/{slug} URL", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema.mainEntityOfPage).toBe(
      "https://www.codu.co/d/whats-your-actual-agent-stack-sicu7k8",
    );
  });

  it("uses honest datePublished and dateModified", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema.datePublished).toBe("2026-05-01T10:00:00.000Z");
    expect(schema.dateModified).toBe("2026-05-02T12:00:00.000Z");
  });

  it("strips HTML from the OP text", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema.text).toBe("I'm curious what people are actually running.");
    expect(schema.text).not.toContain("<strong>");
  });

  it("emits the author as a Person ref with a profile url", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema.author).toMatchObject({
      "@type": "Person",
      name: "Niall Maher",
      url: "https://www.codu.co/niall-maher-p13",
    });
  });

  it("emits interactionStatistic with comment + like counters", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema.interactionStatistic).toEqual([
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "CommentAction" },
        userInteractionCount: 2,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: 7,
      },
    ]);
  });

  it("emits comment[] with Comment objects (text, dateCreated, author url, url)", () => {
    const schema = getDiscussionForumPostingSchema(baseInput);
    expect(schema.comment).toHaveLength(2);
    expect(schema.comment?.[0]).toEqual({
      "@type": "Comment",
      text: "We run LangGraph + Bedrock.",
      dateCreated: "2026-05-01T11:00:00.000Z",
      author: {
        "@type": "Person",
        name: "Ada",
        url: "https://www.codu.co/ada-l",
      },
      url: "https://www.codu.co/d/whats-your-actual-agent-stack-sicu7k8#comment-c1",
    });
  });

  it("yields an empty comment array and zero comment counter when there are no comments", () => {
    const schema = getDiscussionForumPostingSchema({
      ...baseInput,
      comments: [],
    });
    expect(schema.comment).toEqual([]);
    expect(schema.interactionStatistic[0].userInteractionCount).toBe(0);
  });
});
