import { describe, expect, it } from "vitest";
import { contentTypeFor, normalizeKind } from "../../services/render-worker/src/index";

describe("render worker helpers", () => {
  it("accepts only supported render kinds", () => {
    expect(normalizeKind("epub")).toBe("epub");
    expect(normalizeKind("pdf")).toBe("pdf");
    expect(normalizeKind("kpf")).toBe("kpf");
    expect(normalizeKind("docx")).toBeUndefined();
  });

  it("maps render kinds to upload content types", () => {
    expect(contentTypeFor("epub")).toBe("application/epub+zip");
    expect(contentTypeFor("pdf")).toBe("application/pdf");
    expect(contentTypeFor("kpf")).toBe("application/vnd.amazon.mobi8-ebook");
  });
});
