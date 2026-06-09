import { describe, it, expect } from "vitest";
import { extractReadableText } from "./fetchPage";

describe("extractReadableText", () => {
  it("pulls title and strips tags/scripts", () => {
    const html =
      "<html><head><title>Hi</title></head><body><script>var x=1</script><p>Hello world</p></body></html>";
    const out = extractReadableText(html);
    expect(out).toContain("Hi");
    expect(out).toContain("Hello world");
    expect(out.toLowerCase()).not.toContain("var x");
  });
  it("caps length at 4000", () => {
    expect(
      extractReadableText("<p>" + "a".repeat(10000) + "</p>").length,
    ).toBeLessThanOrEqual(4000);
  });
});
