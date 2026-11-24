/**
 * Đường dẫn các tài nguyên tĩnh SVG/hình ảnh dùng chung trong hệ thống (rule frontend §3.2).
 * Đặt file trong `public/`, nơi dùng gọi qua `<Image src={ICON_PATHS.xxx} />`.
 */
export const ICON_PATHS = {
  google: "/icons/google.svg",
  github: "/icons/github.svg",
} as const;

/** Đường dẫn các tài nguyên thương hiệu ToanNX trong `public/brand/`. */
export const BRAND_PATHS = {
  authBanner: "/brand/auth-banner.jpg",
  logoMark: "/brand/logo-mark.png",
  logo: "/brand/logo.png",
  notificationIcon: "/brand/notification-icon.png",
} as const;

/**
 * Chuẩn hóa URL ảnh media từ backend để tương thích với Next.js rewrite `/media/:path*`
 * và tuân thủ Content Security Policy `img-src 'self'`.
 *
 * @param url - URL hình ảnh (có thể là URL tuyệt đối từ local backend, relative path hoặc SVG ngoài).
 * @returns Đường dẫn tương thích với Next.js.
 */
export function normalizeMediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/media\//, "/media/");
}

/**
 * Kiểm tra xem ảnh có cần cờ unoptimized trên Next.js Image không (SVG, data URI, blob).
 *
 * @param url - URL hình ảnh.
 * @returns True nếu cần unoptimized.
 */
export function isUnoptimizedImage(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.includes(".svg") || url.startsWith("data:") || url.startsWith("blob:");
}
