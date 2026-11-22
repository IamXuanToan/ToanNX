/** Ngưỡng độ sáng (0–1) coi là màu sáng: chữ sáng đổ bóng tối và ngược lại. */
const LIGHT_LUMINANCE_THRESHOLD = 0.6;
const DARK_SHADOW = "rgba(0, 0, 0, 0.75)";
const LIGHT_SHADOW = "rgba(255, 255, 255, 0.75)";
const HEX_COLOR = /^#?([0-9a-f]{6})$/i;
const CHANNEL_MAX = 255;

/**
 * Màu bóng cho chữ watermark để chữ nổi trên mọi nền: chữ sáng → bóng tối, chữ tối → bóng sáng.
 * Dùng chung cho ảnh xuất (canvas) và xem trước (CSS `text-shadow`).
 *
 * @param color - Màu chữ dạng `#RRGGBB`; sai định dạng coi như màu sáng.
 * @returns Màu bóng `rgba(...)`.
 */
export function watermarkShadowColor(color: string): string {
  const match = HEX_COLOR.exec(color.trim());
  if (!match) return DARK_SHADOW;
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & CHANNEL_MAX;
  const green = (value >> 8) & CHANNEL_MAX;
  const blue = value & CHANNEL_MAX;
  // Độ sáng cảm nhận (Rec. 601).
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / CHANNEL_MAX;
  return luminance >= LIGHT_LUMINANCE_THRESHOLD ? DARK_SHADOW : LIGHT_SHADOW;
}
