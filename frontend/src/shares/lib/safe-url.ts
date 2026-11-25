/**
 * Kiểm tra và chuẩn hóa URL an toàn trên Frontend, ngăn DOM XSS (`javascript:`, `vbscript:`, `data:text/html`)
 * và chặn ký tự điều khiển hoặc protocol-relative URL (`//evil.com`).
 */

const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/;
const SAFE_DATA_IMAGE_REGEX =
  /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;

/**
 * Chuẩn hóa URL liên kết ngoài hoặc nội bộ chỉ cho phép giao thức `http:` / `https:` (hoặc đường dẫn tương đối `/` an toàn).
 *
 * @param rawUrl - URL cần kiểm tra.
 * @param options - Tùy chọn cho phép đường dẫn tương đối bắt đầu bằng `/`.
 * @returns URL hợp lệ đã cắt khoảng trắng hoặc `null` nếu nguy hiểm / không hợp lệ.
 */
export function toSafeHttpUrl(
  rawUrl: string | null | undefined,
  { allowRelative = true }: { allowRelative?: boolean } = {},
): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || CONTROL_CHAR_REGEX.test(trimmed)) return null;

  if (trimmed.startsWith("/")) {
    if (!allowRelative || trimmed.startsWith("//") || trimmed.startsWith("/\\")) return null;
    try {
      const parsed = new URL(trimmed, "https://app.invalid");
      return parsed.origin === "https://app.invalid" ? trimmed : null;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Kiểm tra URL nguồn ảnh an toàn cho `<Image src={...} />`, chặn `javascript:` và `data:text/html`.
 *
 * @param rawSrc - URL ảnh hoặc data URI ảnh hợp lệ.
 * @returns Chuỗi URL an toàn hoặc chuỗi rỗng `""` nếu không hợp lệ.
 */
export function toSafeImageSrc(rawSrc: string | null | undefined): string {
  if (typeof rawSrc !== "string") return "";
  const trimmed = rawSrc.trim();
  if (!trimmed || CONTROL_CHAR_REGEX.test(trimmed)) return "";
  if (trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.startsWith("data:")) {
    return SAFE_DATA_IMAGE_REGEX.test(trimmed) ? trimmed : "";
  }
  return toSafeHttpUrl(trimmed, { allowRelative: true }) ?? "";
}
