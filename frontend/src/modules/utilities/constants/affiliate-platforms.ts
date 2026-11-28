import type { AffiliateContentConfig, AffiliatePlatformConfig } from "../types/page.types";

/** Danh sách nơi bán mặc định khi khởi tạo một trang Affiliate mới. */
export const DEFAULT_AFFILIATE_PLATFORMS: AffiliatePlatformConfig[] = [
  {
    id: "plat-shopee",
    code: "shopee",
    name: "Shopee",
    urlPattern: "(shopee\\.vn|shp\\.ee|s\\.shopee\\.vn)",
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: "plat-lazada",
    code: "lazada",
    name: "Lazada",
    urlPattern: "(lazada\\.vn|lzd\\.co|s\\.lazada\\.vn)",
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: "plat-tiktok",
    code: "tiktok",
    name: "TikTok Shop",
    urlPattern: "(tiktok\\.com|vt\\.tiktok\\.com)",
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: "plat-tiki",
    code: "tiki",
    name: "Tiki",
    urlPattern: "(tiki\\.vn|ti\\.ki)",
    sortOrder: 3,
    isVisible: true,
  },
  {
    id: "plat-amazon",
    code: "amazon",
    name: "Amazon",
    urlPattern: "(amazon\\.com|amzn\\.to)",
    sortOrder: 4,
    isVisible: true,
  },
];

/** Lấy danh sách nơi bán riêng của trang (trang cũ chưa có thì dùng bộ mặc định). */
export function resolvePageAffiliatePlatforms(
  config?: Partial<AffiliateContentConfig> | null,
): AffiliatePlatformConfig[] {
  if (Array.isArray(config?.platforms)) {
    return config.platforms;
  }
  return DEFAULT_AFFILIATE_PLATFORMS;
}

/** Kiểm tra biểu thức regex nơi bán có hợp lệ về mặt cú pháp hay không. */
export function isValidPlatformRegex(pattern: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed) return true;
  try {
    new RegExp(trimmed, "i");
    return true;
  } catch {
    return false;
  }
}

/** Khớp URL với danh sách nơi bán (regex hoặc danh sách domain phân cách dấu phẩy) của chính trang đó. */
export function matchAffiliatePlatformByUrl(
  url: string,
  platforms: AffiliatePlatformConfig[],
): string {
  const target = url.trim();
  if (!target) return "custom";

  for (const plat of platforms) {
    const code = plat.code.trim();
    const pattern = plat.urlPattern.trim();
    if (!code || !pattern || plat.isVisible === false) continue;

    try {
      const re = new RegExp(pattern, "i");
      if (re.test(target)) return code;
    } catch {
      const parts = pattern
        .split(",")
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);
      const lowered = target.toLowerCase();
      if (parts.some((part) => lowered.includes(part))) {
        return code;
      }
    }
  }
  return "custom";
}

/** Lấy tên hiển thị của nơi bán theo shortcode trên trang. */
export function getAffiliatePlatformName(
  code: string,
  platforms: AffiliatePlatformConfig[],
  customLabel: string,
): string {
  if (!code || code === "custom") return customLabel;
  const matched = platforms.find((p) => p.code === code);
  if (matched?.name) return matched.name;
  const fallback = DEFAULT_AFFILIATE_PLATFORMS.find((p) => p.code === code);
  return fallback?.name ?? code;
}
