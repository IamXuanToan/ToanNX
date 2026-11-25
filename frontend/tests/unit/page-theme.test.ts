// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useResolvedPageTheme } from "@/modules/utilities/hooks/use-resolved-page-theme";
import { resolvePageTheme } from "@/modules/utilities/lib/page-theme";
import type { PublicPage } from "@/modules/utilities/types/page.types";

let mockSystemTheme: "light" | "dark" = "dark";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mockSystemTheme }),
}));

function makePage(theme: Record<string, unknown> = {}): PublicPage {
  return {
    id: "page-1",
    segment: "p",
    slug: "do-cong-nghe",
    status: "PUBLISHED",
    preview: false,
    title: "Đồ công nghệ",
    description: "",
    canonicalUrl: "",
    seoTitle: "",
    seoDescription: "",
    avatarUrl: null,
    coverUrl: null,
    theme: theme as PublicPage["theme"],
    pageType: "AFFILIATE",
    templateKey: "product_grid",
    templateVersion: 1,
    contentConfig: {},
    styleConfig: {},
    responsiveConfig: {},
    content: { type: "doc", content: [] },
  };
}

describe("Phân giải theme Light/Dark cho trang công khai", () => {
  it("chế độ system (hoặc chưa chỉ định mode) ăn theo hệ thống Dark và bỏ qua nền trắng mặc định", () => {
    const page1 = resolvePageTheme(makePage({ primaryColor: "#3D812E" }), "dark");
    expect(page1.isDark).toBe(true);
    expect(page1.customStyle["--background" as keyof typeof page1.customStyle]).toBe("#09090b");
    expect(page1.customStyle["--ring" as keyof typeof page1.customStyle]).toBe("#3D812E");

    const pageGioiThieu = resolvePageTheme(
      makePage({ mode: "system", backgroundColor: "#ffffff", textColor: "#0f172a" }),
      "dark",
    );
    expect(pageGioiThieu.isDark).toBe(true);
    expect(
      pageGioiThieu.customStyle["--background" as keyof typeof pageGioiThieu.customStyle],
    ).toBe("#09090b");
    expect(
      pageGioiThieu.customStyle["--foreground" as keyof typeof pageGioiThieu.customStyle],
    ).toBe("#f4f4f5");
  });

  it("chế độ light / dark cố định không bị ghi đè bởi theme hệ thống", () => {
    const fixedLight = resolvePageTheme(
      makePage({ mode: "light", backgroundColor: "#FFFBEB", primaryColor: "#EA580C" }),
      "dark",
    );
    expect(fixedLight.isDark).toBe(false);
    expect(fixedLight.customStyle["--background" as keyof typeof fixedLight.customStyle]).toBe(
      "#FFFBEB",
    );
    expect(fixedLight.customStyle["--ring" as keyof typeof fixedLight.customStyle]).toBe("#EA580C");

    const fixedDark = resolvePageTheme(makePage({ mode: "dark" }), "light");
    expect(fixedDark.isDark).toBe(true);
  });

  it("hook useResolvedPageTheme tự cập nhật theo next-themes resolvedTheme", () => {
    mockSystemTheme = "dark";
    const { result, rerender } = renderHook(() =>
      useResolvedPageTheme(makePage({ mode: "system", primaryColor: "#ef4444" })),
    );
    expect(result.current.isDark).toBe(true);

    mockSystemTheme = "light";
    rerender();
    expect(result.current.isDark).toBe(false);
  });
});
