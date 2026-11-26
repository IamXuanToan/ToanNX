// @vitest-environment jsdom
import { render, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AffiliatePageRenderer } from "@/modules/utilities/components/page/affiliate-page-renderer";
import { BioPageRenderer } from "@/modules/utilities/components/page/bio-page-renderer";
import { DonationPageRenderer } from "@/modules/utilities/components/page/donation-page-renderer";
import { LegacyTiptapPageRenderer } from "@/modules/utilities/components/page/legacy-tiptap-page-renderer";
import { useResolvedPageTheme } from "@/modules/utilities/hooks/use-resolved-page-theme";
import { resolvePageTheme } from "@/modules/utilities/lib/page-theme";
import type { PublicPage } from "@/modules/utilities/types/page.types";

let mockSystemTheme: "light" | "dark" = "dark";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mockSystemTheme }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("@/shares/components/common/tiptap-content", () => ({
  TiptapContent: () => createElement("div", { "data-testid": "tiptap-content" }),
}));

vi.mock("@/modules/utilities/components/page/donation-public-feed", () => ({
  DonationPublicFeed: () => createElement("div", { "data-testid": "donation-public-feed" }),
}));

function makePage(
  theme: Record<string, unknown> = {},
  pageType: PublicPage["pageType"] = "AFFILIATE",
): PublicPage {
  return {
    id: "page-1",
    segment: "p",
    slug: "do-cong-nghe",
    status: "PUBLISHED",
    preview: false,
    title: "Đồ công nghệ",
    description: "Trang mô tả mẫu",
    canonicalUrl: "",
    seoTitle: "",
    seoDescription: "",
    avatarUrl: null,
    coverUrl: null,
    theme: theme as PublicPage["theme"],
    pageType,
    templateKey: "product_grid",
    templateVersion: 1,
    contentConfig: {},
    styleConfig: {},
    responsiveConfig: {},
    content: { type: "doc", content: [] },
  };
}

describe("Phân giải theme Light/Dark cho trang công khai", () => {
  it("chế độ system kế thừa thẳng token hệ thống trong globals.css và bỏ qua nền trung tính mặc định", () => {
    const pageDefaultPrimary = resolvePageTheme(makePage({ primaryColor: "#3D812E" }), "dark");
    expect(pageDefaultPrimary.isDark).toBe(true);
    expect(pageDefaultPrimary.pageThemeScope).toBeUndefined();
    expect(
      pageDefaultPrimary.customStyle["--background" as keyof typeof pageDefaultPrimary.customStyle],
    ).toBeUndefined();
    expect(
      pageDefaultPrimary.customStyle["--primary" as keyof typeof pageDefaultPrimary.customStyle],
    ).toBeUndefined();
    expect(
      pageDefaultPrimary.customStyle[
        "--primary-hover" as keyof typeof pageDefaultPrimary.customStyle
      ],
    ).toBeUndefined();

    const pageGioiThieu = resolvePageTheme(
      makePage({ mode: "system", backgroundColor: "#ffffff", textColor: "#0f172a" }),
      "dark",
    );
    expect(pageGioiThieu.isDark).toBe(true);
    expect(pageGioiThieu.pageThemeScope).toBeUndefined();
    expect(
      pageGioiThieu.customStyle["--background" as keyof typeof pageGioiThieu.customStyle],
    ).toBeUndefined();
    expect(
      pageGioiThieu.customStyle["--foreground" as keyof typeof pageGioiThieu.customStyle],
    ).toBeUndefined();

    const pageLightSystem = resolvePageTheme(
      makePage({ mode: "system", backgroundColor: "#ffffff", textColor: "#1e293b" }),
      "light",
    );
    expect(pageLightSystem.isDark).toBe(false);
    expect(pageLightSystem.pageThemeScope).toBeUndefined();
    expect(
      pageLightSystem.customStyle["--background" as keyof typeof pageLightSystem.customStyle],
    ).toBeUndefined();
    expect(
      pageLightSystem.customStyle["--foreground" as keyof typeof pageLightSystem.customStyle],
    ).toBeUndefined();
  });

  it("đồng bộ --primary, --primary-hover, --primary-light và --ring khi có màu nhấn riêng", () => {
    const customPrimary = resolvePageTheme(
      makePage({ mode: "system", primaryColor: "#4F46E5" }),
      "dark",
    );
    expect(customPrimary.isDark).toBe(true);
    expect(customPrimary.pageThemeScope).toBeUndefined();
    expect(customPrimary.customStyle["--primary" as keyof typeof customPrimary.customStyle]).toBe(
      "#4F46E5",
    );
    expect(customPrimary.customStyle["--ring" as keyof typeof customPrimary.customStyle]).toBe(
      "#4F46E5",
    );
    expect(
      customPrimary.customStyle["--primary-hover" as keyof typeof customPrimary.customStyle],
    ).toMatch(/^#[0-9a-f]{6}$/);
    expect(
      customPrimary.customStyle["--primary-light" as keyof typeof customPrimary.customStyle],
    ).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("chế độ light / dark cố định gắn data-page-theme cô lập khỏi theme hệ thống", () => {
    const fixedLight = resolvePageTheme(
      makePage({ mode: "light", backgroundColor: "#FFFBEB", primaryColor: "#EA580C" }),
      "dark",
    );
    expect(fixedLight.isDark).toBe(false);
    expect(fixedLight.pageThemeScope).toBe("light");
    expect(fixedLight.customStyle["--background" as keyof typeof fixedLight.customStyle]).toBe(
      "#FFFBEB",
    );
    expect(fixedLight.customStyle["--ring" as keyof typeof fixedLight.customStyle]).toBe("#EA580C");

    const fixedDark = resolvePageTheme(makePage({ mode: "dark" }), "light");
    expect(fixedDark.isDark).toBe(true);
    expect(fixedDark.pageThemeScope).toBe("dark");
    expect(
      fixedDark.customStyle["--background" as keyof typeof fixedDark.customStyle],
    ).toBeUndefined();
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

  it("các renderer không gắn class .light/.dark xung đột ở mode system và gắn data-page-theme khi cố định", () => {
    mockSystemTheme = "dark";
    const systemProps = { mode: "system" };

    const { container: affSys } = render(
      createElement(AffiliatePageRenderer, { page: makePage(systemProps, "AFFILIATE") }),
    );
    const affMain = affSys.querySelector("main");
    expect(affMain?.getAttribute("data-page-theme")).toBeNull();
    expect(affMain?.classList.contains("light")).toBe(false);
    expect(affMain?.classList.contains("dark")).toBe(false);

    const { container: bioSys } = render(
      createElement(BioPageRenderer, { page: makePage(systemProps, "BIO") }),
    );
    expect(bioSys.querySelector("main")?.getAttribute("data-page-theme")).toBeNull();

    const { container: donSys } = render(
      createElement(DonationPageRenderer, { page: makePage(systemProps, "DONATION") }),
    );
    expect(donSys.querySelector("main")?.getAttribute("data-page-theme")).toBeNull();

    const { container: legacySys } = render(
      createElement(LegacyTiptapPageRenderer, { page: makePage(systemProps, "LEGACY_PAGE") }),
    );
    expect(legacySys.querySelector("main")?.getAttribute("data-page-theme")).toBeNull();

    const { container: fixedLightDom } = render(
      createElement(BioPageRenderer, { page: makePage({ mode: "light" }, "BIO") }),
    );
    expect(fixedLightDom.querySelector("main")?.getAttribute("data-page-theme")).toBe("light");
  });
});
