// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  DEMO_TEMPLATE_TYPE,
  DEMO_TEMPLATE_TYPES,
  isDemoTemplateType,
} from "@/modules/utilities/constants/page-constants";
import { THEME_PRESETS } from "@/modules/utilities/constants/page-theme-presets";
import {
  extractCleanDomain,
  getLinkPlatformIcon,
} from "@/modules/utilities/components/page/bio-link-icon";
import { parsePresetAmount } from "@/modules/utilities/components/page/donation-page-renderer";
import { useDonationPageRenderer } from "@/modules/utilities/components/page/hooks/use-donation-page-renderer";
import { fromPage, pageSchema, toPageInput } from "@/modules/utilities/schemas/page.schema";
import type { PageDetail } from "@/modules/utilities/types/page.types";
import { normalizeSearchText } from "@/shares/lib/search-text";

describe("Hệ thống Template Trang (Page Template System)", () => {
  const dummyT = (key: string) => key;

  it("pageSchema: xác thực thành công cấu hình trang Affiliate", () => {
    const schema = pageSchema(dummyT as never);
    const validData = {
      pathId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Góc Công Nghệ",
      slug: "tech-corner",
      description: "Tổng hợp đồ công nghệ",
      status: "PUBLISHED" as const,
      template: "blank" as const,
      pageType: "AFFILIATE" as const,
      templateKey: "product_grid",
      templateVersion: 1,
      contentConfig: {
        items: [
          {
            id: "item-1",
            displayMode: "product",
            title: "Bàn phím cơ AKKO",
            destinationUrl: "https://shopee.vn/product/123",
            platform: "shopee",
            priceConfig: { mode: "fixed", amount: 1200000 },
          },
        ],
        categories: [{ id: "cat-1", name: "Bàn phím" }],
      },
      styleConfig: {
        primaryColor: "#3D812E",
        layout: "grid" as const,
        showPrice: true,
      },
      responsiveConfig: {
        desktopColumns: 3,
        tabletColumns: 2,
        mobileColumns: 1,
      },
      themeMode: "light" as const,
      primaryColor: "#3D812E",
      backgroundColor: "#FFFFFF",
      textColor: "#1E293B",
      buttonStyle: "rounded" as const,
      avatar: null,
      cover: null,
      seoTitle: "",
      seoDescription: "",
      content: { type: "doc", content: [] },
    };

    const parsed = schema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("pageSchema: từ chối pageType không hợp lệ", () => {
    const schema = pageSchema(dummyT as never);
    const invalidData = {
      pathId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Trang Lỗi",
      slug: "invalid-type",
      pageType: "UNSUPPORTED_TYPE",
      status: "DRAFT",
    };

    const parsed = schema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("fromPage & toPageInput: bảo toàn 100% các cấu hình template", () => {
    const pageDetail: PageDetail = {
      id: "page-123",
      title: "Góc Setup",
      slug: "setup-hub",
      status: "PUBLISHED",
      pageType: "AFFILIATE",
      templateKey: "product_grid",
      templateVersion: 1,
      path: { id: "path-1", segment: "p", name: "Trang" },
      publicUrl: "https://toannx.com/p/setup-hub",
      owner: {
        id: "user-1",
        email: "toan@example.com",
        username: "toannx",
        fullName: "Toan Nguyen",
      },
      description: "Mô tả góc setup",
      seoTitle: "SEO Setup",
      seoDescription: "SEO Description",
      theme: { mode: "dark", primaryColor: "#4F46E5", buttonStyle: "pill" },
      contentConfig: {
        items: [{ id: "it-1", title: "Màn hình 4K" }],
      },
      styleConfig: { layout: "grid", primaryColor: "#4F46E5" },
      responsiveConfig: { desktopColumns: 4 },
      avatar: null,
      cover: null,
      content: { type: "doc", content: [] },
      contentVersion: 2,
      publishedAt: "2026-11-22T00:00:00Z",
      createdAt: "2026-11-20T00:00:00Z",
      updatedAt: "2026-11-22T00:00:00Z",
    };

    const formValues = fromPage(pageDetail);
    expect(formValues.pageType).toBe("AFFILIATE");
    expect(formValues.templateKey).toBe("product_grid");
    expect(formValues.contentConfig).toEqual({ items: [{ id: "it-1", title: "Màn hình 4K" }] });
    expect(formValues.styleConfig.layout).toBe("grid");

    const input = toPageInput(formValues, pageDetail, false);
    expect(input.pageType).toBe("AFFILIATE");
    expect(input.templateKey).toBe("product_grid");
    expect(input.contentConfig).toEqual({ items: [{ id: "it-1", title: "Màn hình 4K" }] });
    expect(input.styleConfig).toEqual(expect.objectContaining({ layout: "grid" }));
  });

  it("fromPage: chuẩn hóa cấu hình từ snake_case sang camelCase (display_name, bio_text)", () => {
    const rawPageDetail = {
      id: "page-bio-1",
      title: "ToanNX - Kỹ Sư Phần Mềm & Creator",
      slug: "toannx-bio",
      status: "PUBLISHED" as const,
      pageType: "BIO" as const,
      templateKey: "creator_bio",
      templateVersion: 1,
      path: { id: "path-1", segment: "p", name: "Trang" },
      publicUrl: "https://toannx.com/p/toannx-bio",
      owner: {
        id: "user-1",
        email: "toan@example.com",
        username: "toannx",
        fullName: "Toan Nguyen",
      },
      description: "Mô tả cá nhân",
      seoTitle: "SEO Bio",
      seoDescription: "SEO Bio Desc",
      theme: { mode: "system" as const, primaryColor: "#6366f1", buttonStyle: "pill" as const },
      contentConfig: {
        profile: {
          display_name: "Xuân Toàn",
          bio_text: "Full-stack Software Engineer",
        },
        links: [{ id: "l-1", title: "Website", url: "https://toannx.com", is_visible: true }],
      },
      styleConfig: { primary_color: "#6366f1" },
      responsiveConfig: { mobile_columns: 1 },
      avatar: null,
      cover: null,
      content: { type: "doc", content: [] },
      contentVersion: 1,
      publishedAt: "2026-11-20T00:00:00Z",
      createdAt: "2026-11-20T00:00:00Z",
      updatedAt: "2026-11-20T00:00:00Z",
    };

    const formValues = fromPage(rawPageDetail as PageDetail);
    const contentCfg = formValues.contentConfig as {
      profile: { displayName: string; bioText: string };
      links: Array<{ isVisible: boolean }>;
    };
    const styleCfg = formValues.styleConfig as { primaryColor: string };
    const responsiveCfg = formValues.responsiveConfig as { mobileColumns: number };

    expect(contentCfg.profile.displayName).toBe("Xuân Toàn");
    expect(contentCfg.profile.bioText).toBe("Full-stack Software Engineer");
    expect(contentCfg.links[0]?.isVisible).toBe(true);
    expect(styleCfg.primaryColor).toBe("#6366f1");
    expect(responsiveCfg.mobileColumns).toBe(1);
  });

  it("Tìm kiếm diacritics tiếng Việt chuẩn xác cho storefront", () => {
    const productName = "Bộ Dụng Cụ Lắp Ráp Gundam";
    const normalizedName = normalizeSearchText(productName);

    // Gõ không dấu, chữ hoa thường đều tìm được
    expect(normalizedName.includes(normalizeSearchText("gundam"))).toBe(true);
    expect(normalizedName.includes(normalizeSearchText("bo dung cu"))).toBe(true);
    expect(normalizedName.includes(normalizeSearchText("LẮP RÁP"))).toBe(true);
    expect(normalizedName.includes(normalizeSearchText("lap rap"))).toBe(true);
    expect(normalizedName.includes(normalizeSearchText("kiem nhat"))).toBe(false);
  });

  it("Định tuyến Demo Template (/demo/[type]) không dùng magic strings và xác thực chặt chẽ", () => {
    // 3 loại mẫu chuẩn
    expect(DEMO_TEMPLATE_TYPES).toEqual(["affiliate", "bio", "donation"]);
    expect(isDemoTemplateType(DEMO_TEMPLATE_TYPE.AFFILIATE)).toBe(true);
    expect(isDemoTemplateType(DEMO_TEMPLATE_TYPE.BIO)).toBe(true);
    expect(isDemoTemplateType(DEMO_TEMPLATE_TYPE.DONATION)).toBe(true);

    // Không chấp nhận magic string hay tên tùy tiện
    expect(isDemoTemplateType("ho-so")).toBe(false);
    expect(isDemoTemplateType("quyen-gop")).toBe(false);
    expect(isDemoTemplateType("ung-ho")).toBe(false);
    expect(isDemoTemplateType("random")).toBe(false);
  });

  it("Bộ màu có sẵn (THEME_PRESETS) đầy đủ màu sắc, chế độ và kiểu nút hợp lệ", () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(5);
    const hexPattern = /^#[0-9a-fA-F]{6}$/;

    for (const preset of THEME_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(hexPattern.test(preset.primary)).toBe(true);
      expect(hexPattern.test(preset.bg)).toBe(true);
      expect(hexPattern.test(preset.text)).toBe(true);
      expect(["rounded", "pill", "square"]).toContain(preset.buttonStyle);
      if (preset.mode) {
        expect(["system", "light", "dark"]).toContain(preset.mode);
      }
    }
  });

  it("Donation: chọn đúng mã mặc định khi chuyển sang chế độ single", () => {
    const qrCodes = [
      {
        id: "qr-1",
        type: "BANK_TRANSFER" as const,
        title: "MBBank",
        accountNumber: "111111",
        accountHolder: "NGUYEN VAN A",
        isDefault: false,
      },
      {
        id: "qr-2",
        type: "CUSTOM" as const,
        title: "Ví MoMo",
        accountNumber: "0988888888",
        accountHolder: "NGUYEN VAN A",
        isDefault: true,
      },
      {
        id: "qr-3",
        type: "BANK_TRANSFER" as const,
        title: "Vietcombank",
        accountNumber: "333333",
        accountHolder: "NGUYEN VAN A",
        isDefault: false,
      },
    ];

    // Tìm mã mặc định
    const defaultQr = qrCodes.find((q) => q.isDefault) ?? qrCodes[0];
    expect(defaultQr.id).toBe("qr-2");
    expect(defaultQr.title).toBe("Ví MoMo");

    // Nếu không có mã nào set isDefault, fallback về mã đầu tiên
    const noDefaultQrCodes = qrCodes.map((q) => ({ ...q, isDefault: false }));
    const fallbackDefault = noDefaultQrCodes.find((q) => q.isDefault) ?? noDefaultQrCodes[0];
    expect(fallbackDefault.id).toBe("qr-1");
  });

  it("parsePresetAmount: tách nhãn mô tả và số tiền 2 dòng chống tràn viền", () => {
    // Trường hợp 1: Nhãn có kèm tiền trong ngoặc đơn
    const item1 = parsePresetAmount({
      amount: 200000,
      label: "1 cuốn sách công nghệ (200.000 đ)",
    });
    expect(item1.title).toBe("1 cuốn sách công nghệ");
    expect(item1.amount).toBe("200.000 ₫");

    // Trường hợp 2: Nhãn có kèm tiền dạng gạch nối
    const item2 = parsePresetAmount({
      amount: 50000,
      label: "1 ly cà phê muối - 50.000 ₫",
    });
    expect(item2.title).toBe("1 ly cà phê muối");
    expect(item2.amount).toBe("50.000 ₫");

    // Trường hợp 3: Nhãn chỉ có số tiền
    const item3 = parsePresetAmount({
      amount: 100000,
      label: "100.000 ₫",
    });
    expect(item3.title).toBeNull();
    expect(item3.amount).toBe("100.000 ₫");
  });

  it("useDonationPageRenderer: tự động điền nội dung từ option gợi ý khi chưa nhập tay, và giữ nguyên khi đã nhập tay", () => {
    const qrCodes = [
      {
        id: "qr-1",
        type: "BANK_TRANSFER" as const,
        title: "MBBank",
        bankBin: "970422",
        accountNumber: "9999999999",
        accountHolder: "NGUYEN XUAN TOAN",
        isDefault: true,
      },
    ];

    const { result } = renderHook(() =>
      useDonationPageRenderer(qrCodes, "9999999999", 10000, "single"),
    );

    // Ban đầu nội dung rỗng, transferNote mặc định là "donate"
    expect(result.current.customNote).toBe("");
    expect(result.current.transferNote).toBe("donate");
    expect(result.current.vietQrNote).toBe("donate");
    expect(result.current.isNoteManuallyEdited).toBe(false);

    // 1. Khi chưa nhập tay: Bấm chọn mốc gợi ý "1 ly cà phê muối"
    act(() => {
      result.current.handleSelectPresetAmount(50000, "1 ly cà phê muối");
    });
    expect(result.current.selectedAmount).toBe(50000);
    expect(result.current.customNote).toBe("1 ly cà phê muối");
    expect(result.current.transferNote).toBe("donate 1 ly cà phê muối");
    expect(result.current.vietQrNote).toBe("donate 1 ly ca phe muoi");
    expect(result.current.isNoteManuallyEdited).toBe(false);

    // 2. Khi chưa nhập tay: Đổi sang mốc gợi ý khác "1 bữa sáng no nê" -> tự động cập nhật nội dung mới
    act(() => {
      result.current.handleSelectPresetAmount(100000, "1 bữa sáng no nê");
    });
    expect(result.current.selectedAmount).toBe(100000);
    expect(result.current.customNote).toBe("1 bữa sáng no nê");
    expect(result.current.transferNote).toBe("donate 1 bữa sáng no nê");
    expect(result.current.vietQrNote).toBe("donate 1 bua sang no ne");
    expect(result.current.isNoteManuallyEdited).toBe(false);

    // 3. Người dùng nhập tay nội dung riêng
    act(() => {
      result.current.handleCustomNoteChange("Toan gui ung ho");
    });
    expect(result.current.customNote).toBe("Toan gui ung ho");
    expect(result.current.isNoteManuallyEdited).toBe(true);
    expect(result.current.transferNote).toBe("donate Toan gui ung ho");
    expect(result.current.vietQrNote).toBe("donate Toan gui ung ho");

    // 4. Khi ĐÃ nhập tay: Bấm chọn các mốc gợi ý khác -> nội dung GIỮ NGUYÊN không bị thay đổi
    act(() => {
      result.current.handleSelectPresetAmount(200000, "1 cuốn sách công nghệ");
    });
    expect(result.current.selectedAmount).toBe(200000);
    expect(result.current.customNote).toBe("Toan gui ung ho"); // Vẫn giữ nguyên!
    expect(result.current.transferNote).toBe("donate Toan gui ung ho");
    expect(result.current.vietQrNote).toBe("donate Toan gui ung ho");
    expect(result.current.isNoteManuallyEdited).toBe(true);

    // 5. Khi người dùng xóa trắng nội dung (clear) -> reset cờ tự nhập
    act(() => {
      result.current.handleCustomNoteChange("");
    });
    expect(result.current.customNote).toBe("");
    expect(result.current.isNoteManuallyEdited).toBe(false);

    // 6. Sau khi đã clear, chọn lại option gợi ý -> lại tự động điền
    act(() => {
      result.current.handleSelectPresetAmount(500000, "Gói tài trợ server 1 tháng");
    });
    expect(result.current.selectedAmount).toBe(500000);
    expect(result.current.customNote).toBe("Gói tài trợ server 1 tháng");
    expect(result.current.transferNote).toBe("donate Gói tài trợ server 1 tháng");
    // vietQrNote cắt tối đa 30 ký tự theo chuẩn Napas 247
    expect(result.current.vietQrNote).toBe("donate Goi tai tro server 1 th");

    // 7. Bấm bỏ chọn (unselect) mức tiền hiện tại khi chưa sửa tay -> tự động xóa trắng customNote
    act(() => {
      result.current.handleSelectPresetAmount(500000, "Gói tài trợ server 1 tháng");
    });
    expect(result.current.selectedAmount).toBeNull();
    expect(result.current.customNote).toBe("");
    expect(result.current.transferNote).toBe("donate");
  });

  it("BioLinkIcon: extractCleanDomain chuẩn hóa domain từ link", () => {
    expect(extractCleanDomain("https://facebook.com/toannx")).toBe("facebook.com");
    expect(extractCleanDomain("http://www.youtube.com/@channel")).toBe("youtube.com");
    expect(extractCleanDomain("github.com/torvalds")).toBe("github.com");
    expect(extractCleanDomain("https://sub.domain.vn:8080/path?query=1")).toBe("sub.domain.vn");
    expect(extractCleanDomain("")).toBe("");
    expect(extractCleanDomain(null)).toBe("");
  });

  it("BioLinkIcon: getLinkPlatformIcon nhận diện chính xác nền tảng xã hội", () => {
    expect(getLinkPlatformIcon("https://youtube.com/watch?v=123", "Video").color).toBe(
      "text-red-500",
    );
    expect(getLinkPlatformIcon("https://tiktok.com/@user", "TikTok").color).toContain("neutral");
    expect(getLinkPlatformIcon("https://instagram.com/photo", "IG").color).toBe("text-pink-500");
    expect(getLinkPlatformIcon("https://facebook.com/me", "FB").color).toBe("text-blue-600");
    expect(getLinkPlatformIcon("https://github.com/toan", "Mã nguồn").color).toContain("neutral");
    expect(getLinkPlatformIcon("https://t.me/toan", "Telegram").color).toBe("text-sky-500");
    expect(getLinkPlatformIcon("https://shopee.vn/item", "Shop").color).toBe("text-orange-500");
    expect(getLinkPlatformIcon("mailto:toan@toannx.com", "Email").color).toBe("text-emerald-500");
    expect(getLinkPlatformIcon("https://myblog.com", "Blog").color).toBe("text-primary");
  });

  it("THEME_PRESETS: phân cụm sáng (19) và tối (15) rõ ràng, không trùng tên", () => {
    const lightPresets = THEME_PRESETS.filter((p) => p.mode === "light");
    const darkPresets = THEME_PRESETS.filter((p) => p.mode === "dark");

    expect(lightPresets.length).toBe(19);
    expect(darkPresets.length).toBe(15);
    expect(THEME_PRESETS.length).toBe(34);

    const names = new Set(THEME_PRESETS.map((p) => p.name.toLowerCase()));
    expect(names.size).toBe(THEME_PRESETS.length);
  });
});
