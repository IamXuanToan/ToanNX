/**
 * Danh mục các loại trang tùy chỉnh được hỗ trợ trong hệ thống Template-Based.
 * Giúp tránh sử dụng magic strings và đồng bộ với enum BE `Page.PageType`.
 */
export const PAGE_TYPE = {
  AFFILIATE: "AFFILIATE",
  BIO: "BIO",
  DONATION: "DONATION",
  PRODUCT_CATALOG: "PRODUCT_CATALOG",
  PORTFOLIO: "PORTFOLIO",
  LANDING: "LANDING",
  LEGACY_PAGE: "LEGACY_PAGE",
} as const;

export type PageTypeValue = (typeof PAGE_TYPE)[keyof typeof PAGE_TYPE];

/**
 * Danh mục các loại mẫu template hiển thị trên trang xem trước trực tiếp (Demo Studio).
 */
export const DEMO_TEMPLATE_TYPE = {
  AFFILIATE: "affiliate",
  BIO: "bio",
  DONATION: "donation",
} as const;

export type DemoTemplateTypeValue = (typeof DEMO_TEMPLATE_TYPE)[keyof typeof DEMO_TEMPLATE_TYPE];

export const DEMO_TEMPLATE_TYPES = [
  DEMO_TEMPLATE_TYPE.AFFILIATE,
  DEMO_TEMPLATE_TYPE.BIO,
  DEMO_TEMPLATE_TYPE.DONATION,
] as const;

/**
 * Kiểm tra xem một chuỗi có phải là loại template demo hợp lệ không.
 *
 * @param value - Giá trị cần kiểm tra.
 * @returns True nếu là loại template demo hợp lệ.
 */
export function isDemoTemplateType(value: string): value is DemoTemplateTypeValue {
  return (DEMO_TEMPLATE_TYPES as readonly string[]).includes(value);
}

/**
 * Danh sách các icon gợi ý tiêu chuẩn cho mốc ủng hộ tài chính (Donation Suggested Amounts).
 */
export const DONATION_SUGGESTED_ICONS = [
  { value: "coffee", label: "Cà phê / Trà" },
  { value: "utensils", label: "Bữa ăn / Ẩm thực" },
  { value: "heart", label: "Trái tim / Yêu thích" },
  { value: "sparkles", label: "Tỏa sáng / Đặc biệt" },
  { value: "beer", label: "Cốc bia / Giải khát" },
  { value: "gift", label: "Hộp quà / Quà tặng" },
  { value: "book", label: "Sách / Tri thức" },
  { value: "server", label: "Máy chủ / Hạ tầng" },
  { value: "zap", label: "Tia chớp / Năng lượng" },
  { value: "smile", label: "Nụ cười / Vui vẻ" },
  { value: "thumbs-up", label: "Ủng hộ / Like" },
  { value: "award", label: "Huy hiệu / Cúp" },
] as const;

export type DonationSuggestedIconKey = (typeof DONATION_SUGGESTED_ICONS)[number]["value"];
