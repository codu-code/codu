import { describe, it, expect } from "vitest";
import { isPubliclyFetchableHost } from "./ssrfGuard";

describe("isPubliclyFetchableHost", () => {
  it("allows ordinary public hostnames and public IPs", () => {
    expect(isPubliclyFetchableHost("example.com")).toBe(true);
    expect(isPubliclyFetchableHost("www.codu.co")).toBe(true);
    expect(isPubliclyFetchableHost("1.2.3.4")).toBe(true);
    expect(isPubliclyFetchableHost("8.8.8.8")).toBe(true);
  });

  it("blocks localhost and loopback", () => {
    expect(isPubliclyFetchableHost("localhost")).toBe(false);
    expect(isPubliclyFetchableHost("127.0.0.1")).toBe(false);
    expect(isPubliclyFetchableHost("127.1.2.3")).toBe(false);
    expect(isPubliclyFetchableHost("::1")).toBe(false);
    expect(isPubliclyFetchableHost("[::1]")).toBe(false);
  });

  it("blocks link-local / cloud metadata", () => {
    expect(isPubliclyFetchableHost("169.254.169.254")).toBe(false);
    expect(isPubliclyFetchableHost("169.254.0.1")).toBe(false);
    expect(isPubliclyFetchableHost("fe80::1")).toBe(false);
  });

  it("blocks private ranges", () => {
    expect(isPubliclyFetchableHost("10.0.0.5")).toBe(false);
    expect(isPubliclyFetchableHost("192.168.1.1")).toBe(false);
    expect(isPubliclyFetchableHost("172.16.0.1")).toBe(false);
    expect(isPubliclyFetchableHost("172.31.255.255")).toBe(false);
    expect(isPubliclyFetchableHost("fc00::1")).toBe(false);
    expect(isPubliclyFetchableHost("fd12:3456::1")).toBe(false);
  });

  it("does NOT block public IPs near private ranges", () => {
    // 172.15/172.32 are outside the 172.16.0.0/12 private block
    expect(isPubliclyFetchableHost("172.15.0.1")).toBe(true);
    expect(isPubliclyFetchableHost("172.32.0.1")).toBe(true);
    // 169.1.1.1 is not link-local
    expect(isPubliclyFetchableHost("169.1.1.1")).toBe(true);
  });

  it("blocks unspecified address and .internal/.local suffixes", () => {
    expect(isPubliclyFetchableHost("0.0.0.0")).toBe(false);
    expect(isPubliclyFetchableHost("metadata.internal")).toBe(false);
    expect(isPubliclyFetchableHost("printer.local")).toBe(false);
  });

  it("blocks empty / malformed input (fail closed)", () => {
    expect(isPubliclyFetchableHost("")).toBe(false);
  });

  it("handles IPv4-mapped IPv6 loopback", () => {
    expect(isPubliclyFetchableHost("::ffff:127.0.0.1")).toBe(false);
  });
});
