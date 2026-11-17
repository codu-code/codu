import { afterEach, describe, it, expect, vi } from "vitest";
import { extractReadableText, fetchPublicHtml } from "./fetchPage";

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

describe("fetchPublicHtml", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const redirect = (location: string) =>
    new Response(null, { status: 302, headers: { location } });

  it("follows a redirect to another public host", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(redirect("https://93.184.216.35/final"))
      .mockResolvedValueOnce(new Response("<p>hello</p>"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchPublicHtml("https://93.184.216.34/start")).toBe(
      "<p>hello</p>",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not follow a redirect to an internal host", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(redirect("http://169.254.169.254/latest/"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchPublicHtml("https://93.184.216.34/start")).toBe("");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never fetches an internal host or a non-http URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchPublicHtml("http://127.0.0.1/admin")).toBe("");
    expect(await fetchPublicHtml("file:///etc/passwd")).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gives up on a redirect loop", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => redirect("https://93.184.216.34/loop"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchPublicHtml("https://93.184.216.34/loop")).toBe("");
  });
});
