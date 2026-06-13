import { describe, it, expect } from "vitest";
import { getProfilePageSchema } from "./profile-page";

const baseInput = {
  name: "Niall Maher",
  username: "niall-maher-p13",
  image: "https://example.com/niall.png",
  bio: "Founder of Codú",
  websiteUrl: "https://niallmaher.com",
  createdAt: "2020-01-15T09:00:00.000Z",
};

describe("getProfilePageSchema", () => {
  it("emits @type ProfilePage with @context", () => {
    const schema = getProfilePageSchema(baseInput);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("ProfilePage");
  });

  it("sets dateCreated from the user's createdAt", () => {
    const schema = getProfilePageSchema(baseInput);
    expect(schema.dateCreated).toBe("2020-01-15T09:00:00.000Z");
  });

  it("emits mainEntity as a Person with name, url, image, description", () => {
    const schema = getProfilePageSchema(baseInput);
    expect(schema.mainEntity).toMatchObject({
      "@type": "Person",
      name: "Niall Maher",
      url: "https://www.codu.co/niall-maher-p13",
      image: "https://example.com/niall.png",
      description: "Founder of Codú",
    });
  });

  it("includes social/website URLs in mainEntity.sameAs", () => {
    const schema = getProfilePageSchema(baseInput);
    expect(schema.mainEntity.sameAs).toContain("https://niallmaher.com");
  });

  it("omits sameAs and dateCreated cleanly when not provided", () => {
    const schema = getProfilePageSchema({
      name: "Plain User",
      username: "plain-user",
      image: null,
      bio: null,
      websiteUrl: null,
      createdAt: null,
    });
    expect(schema.dateCreated).toBeUndefined();
    expect(schema.mainEntity.sameAs).toBeUndefined();
  });
});
