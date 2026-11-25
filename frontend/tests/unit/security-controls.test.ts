import { describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL, status = 307) => ({ type: "redirect", url: url.toString(), status }),
    rewrite: (url: URL) => ({ type: "rewrite", url: url.toString(), status: 200 }),
    next: () => ({ type: "next", status: 200 }),
  },
}));

vi.mock("next-intl/middleware", () => ({
  default: () => () => ({ type: "intl", status: 200 }),
}));

vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`,
}));

vi.mock("@/i18n/request-locale", () => ({
  LOCALE_COOKIE: "NEXT_LOCALE",
  resolveRequestLocale: () => "vi",
}));

import { sanitizeNextPath } from "@/modules/system/services/auth.service";
import proxy from "@/proxy";
import { toSafeHttpUrl, toSafeImageSrc } from "@/shares/lib/safe-url";

describe("kiểm soát bảo mật Frontend (Open Redirect, Safe URL, Edge Proxy)", () => {
  describe("sanitizeNextPath chống Open Redirect", () => {
    it("chấp nhận đường dẫn nội bộ hợp lệ và rút gọn locale lặp", () => {
      expect(sanitizeNextPath("/vi/quan-tri/tai-chinh")).toBe("/vi/quan-tri/tai-chinh");
      expect(sanitizeNextPath("/vi/vi/ca-nhan?tab=1")).toBe("/vi/ca-nhan?tab=1");
    });

    it.each([
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      " /vi/dashboard",
      "/vi/dashboard\t",
      "",
      null,
      undefined,
    ])("từ chối đường dẫn nguy hiểm hoặc có ký tự điều khiển: %j", (payload) => {
      expect(sanitizeNextPath(payload)).toBeNull();
    });
  });

  describe("toSafeHttpUrl & toSafeImageSrc chống XSS", () => {
    it("chặn các scheme nguy hiểm trên link và ảnh", () => {
      for (const malicious of [
        "javascript:alert(1)",
        "JAVASCRIPT:alert(1)",
        "  javascript:alert(1)  ",
        "vbscript:msgbox(1)",
        "data:text/html,<script>alert(1)</script>",
        "file:///etc/passwd",
        "//evil.com/phish",
        "/\t/evil.com",
      ]) {
        expect(toSafeHttpUrl(malicious, { allowRelative: false })).toBeNull();
        expect(toSafeHttpUrl(malicious, { allowRelative: true })).toBeNull();
      }
      expect(toSafeImageSrc("javascript:alert(1)")).toBe("");
      expect(toSafeImageSrc("data:text/html,<script>1</script>")).toBe("");
    });

    it("cho phép http/https và data:image base64 hợp lệ cho ảnh QR", () => {
      expect(toSafeHttpUrl("https://toannx.com/p/demo?a=1", { allowRelative: false })).toBe(
        "https://toannx.com/p/demo?a=1",
      );
      expect(toSafeImageSrc("data:image/svg+xml;base64,PHN2Zz4=")).toBe(
        "data:image/svg+xml;base64,PHN2Zz4=",
      );
      expect(toSafeImageSrc("/media/avatar.png")).toBe("/media/avatar.png");
    });
  });

  describe("Edge proxy chống lỗi URIError khi giải mã URL hỏng", () => {
    it("không ném 500 URIError với percent-encoding sai (%ZZ, %E0%A4%A)", () => {
      const makeRequest = (path: string) =>
        ({
          url: `http://localhost:3001${path}`,
          nextUrl: new URL(`http://localhost:3001${path}`),
          cookies: { get: () => undefined },
        }) as unknown as Parameters<typeof proxy>[0];

      expect(() => proxy(makeRequest("/%ZZ/test"))).not.toThrow();
      expect(() => proxy(makeRequest("/%E0%A4%A/donate"))).not.toThrow();
    });
  });
});
