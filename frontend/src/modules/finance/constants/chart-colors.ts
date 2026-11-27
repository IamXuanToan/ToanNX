/** Bảng màu dự phòng cho biểu đồ khi nền tảng chưa cấu hình mã màu HEX. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;

/** Các màu gợi ý chuẩn tương phản cho Nền tảng Tài chính. */
export const PLATFORM_COLOR_PRESETS = [
  "#2563EB",
  "#DC2626",
  "#0891B2",
  "#EA580C",
  "#DB2777",
  "#7C3AED",
  "#16A34A",
  "#D97706",
] as const;

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const LIGHT_CARD_LUMINANCE = 1.0;
const DARK_CARD_LUMINANCE = 0.008;
const MIN_LIGHT_CONTRAST = 3.5;
const MIN_DARK_CONTRAST = 4.8;

/** @param index - Thứ tự (xoay vòng 8 màu). @returns Giá trị CSS cho Recharts/ChartConfig. */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function isValidHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_COLOR_RE.test(value.trim());
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.trim().slice(1);
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function hexLuminance(hex: string): number {
  const [r, g, b] = parseHexRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

function tuneLightnessForContrast(
  hex: string,
  backgroundLum: number,
  minContrast: number,
  direction: "darker" | "lighter",
): string {
  const currentLum = hexLuminance(hex);
  if (contrastRatio(currentLum, backgroundLum) >= minContrast) {
    return hex.trim().toUpperCase();
  }
  const [r, g, b] = parseHexRgb(hex);
  const [h, s, baseL] = rgbToHsl(r, g, b);
  let lo = direction === "darker" ? 0.08 : baseL;
  let hi = direction === "darker" ? baseL : 0.86;
  let best = hex.trim().toUpperCase();
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const candidateHex = rgbToHex(...hslToRgb(h, s, mid));
    const ratio = contrastRatio(hexLuminance(candidateHex), backgroundLum);
    if (ratio >= minContrast) {
      best = candidateHex;
      if (direction === "darker") lo = mid;
      else hi = mid;
    } else if (direction === "darker") {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

/**
 * Chuyển đổi mã màu HEX người dùng cấu hình thành cặp màu `{ light, dark }` giữ đúng sắc độ
 * nhưng bảo đảm độ tương phản rõ nét trên nền Card Sáng và Card Tối của hệ thống.
 *
 * @param hexColor - Mã màu `#RRGGBB`.
 * @returns Cặp màu cho `ChartContainer` theo từng theme.
 */
export function resolveLightDarkChartColor(hexColor: string): { light: string; dark: string } {
  const normalized = hexColor.trim().toUpperCase();
  return {
    light: tuneLightnessForContrast(normalized, LIGHT_CARD_LUMINANCE, MIN_LIGHT_CONTRAST, "darker"),
    dark: tuneLightnessForContrast(normalized, DARK_CARD_LUMINANCE, MIN_DARK_CONTRAST, "lighter"),
  };
}

/**
 * Trả về cấu hình màu `ChartConfig` cho một nền tảng (dùng màu cấu hình nếu hợp lệ, ngược lại xoay vòng palette).
 *
 * @param label - Tên hiển thị trên chú giải/tooltip.
 * @param color - Mã màu HEX từ backend (có thể rỗng).
 * @param fallbackIndex - Chỉ số xoay vòng mặc định.
 */
export function platformChartConfigItem(
  label: string,
  color: string | null | undefined,
  fallbackIndex: number,
) {
  if (isValidHexColor(color)) {
    return { label, theme: resolveLightDarkChartColor(color) };
  }
  return { label, color: chartColor(fallbackIndex) };
}
