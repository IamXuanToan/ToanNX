import type { CSSProperties } from "react";

import type { PublicPage } from "../types/page.types";

/**
 * Kết quả chuẩn hóa giao diện (light/dark, biến CSS) cho trang công khai.
 */
export interface ResolvedPageTheme {
  /** Có đang hiển thị ở nền tối hay không. */
  isDark: boolean;
  /** Phạm vi ép sáng/tối riêng của trang (`light`/`dark`), bỏ trống khi `mode = "system"` để ăn thẳng theme hệ thống. */
  pageThemeScope: "light" | "dark" | undefined;
  /** Màu nhấn chính của trang. */
  primaryColor: string;
  /** Màu chữ tương phản trên nền chính (`--primary-foreground`). */
  primaryForeground: string;
  /** Bo góc nút theo cấu hình (`rounded-none`, `rounded-full`, `rounded-2xl` / `rounded-xl`). */
  buttonStyle: "rounded" | "square" | "pill";
  /** Các CSS custom properties gắn trực tiếp lên phần tử gốc của trang. */
  customStyle: CSSProperties;
}

const DEFAULT_PRIMARY_COLOR = "#3D812E";

const NEUTRAL_DEFAULT_BACKGROUNDS = new Set([
  "#ffffff",
  "#fff",
  "#fafafa",
  "#09090b",
  "#0a0a0a",
  "#18181b",
]);

const NEUTRAL_DEFAULT_TEXTS = new Set([
  "#000000",
  "#09090b",
  "#0a0a0a",
  "#0f172a",
  "#171717",
  "#1e293b",
  "#f4f4f5",
  "#f8fafc",
  "#fafafa",
  "#ffffff",
]);

function normalizeHexColor(hex?: string | null): string | null {
  if (!hex) return null;
  const trimmed = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function mixHexColor(baseHex: string, targetHex: string, targetWeight: number): string {
  const base = normalizeHexColor(baseHex);
  const target = normalizeHexColor(targetHex);
  if (!base || !target) return baseHex;
  const weight = Math.max(0, Math.min(1, targetWeight));
  const r = Math.round(
    parseInt(base.slice(1, 3), 16) * (1 - weight) + parseInt(target.slice(1, 3), 16) * weight,
  );
  const g = Math.round(
    parseInt(base.slice(3, 5), 16) * (1 - weight) + parseInt(target.slice(3, 5), 16) * weight,
  );
  const b = Math.round(
    parseInt(base.slice(5, 7), 16) * (1 - weight) + parseInt(target.slice(5, 7), 16) * weight,
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Kiểm tra một mã màu HEX có thuộc nhóm màu sáng hay không dựa theo độ sáng cảm nhận (luminance).
 *
 * @param hex - Mã màu HEX (ví dụ `#FFFFFF`).
 * @returns `true` nếu là màu sáng hoặc không phải HEX hợp lệ.
 */
export function isLightHexColor(hex?: string | null): boolean {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return true;
  const r = parseInt(normalized.slice(1, 3), 16) || 0;
  const g = parseInt(normalized.slice(3, 5), 16) || 0;
  const b = parseInt(normalized.slice(5, 7), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/**
 * Tính toán bộ màu và chế độ sáng/tối hiệu lực cho trang công khai, bảo đảm chế độ `system`
 * kế thừa trực tiếp token Light/Dark từ `globals.css` (từ `next-themes`) và đồng bộ biến `--ring`,
 * `--primary-hover`, `--primary-light` khi dùng màu nhấn riêng.
 *
 * @param page - Dữ liệu trang công khai.
 * @param systemResolvedTheme - Theme đang hiệu lực của hệ thống (`light` hoặc `dark`).
 * @returns Thông số giao diện đã phân giải.
 */
export function resolvePageTheme(
  page: PublicPage,
  systemResolvedTheme?: string,
): ResolvedPageTheme {
  const rawTheme = (page.theme ?? {}) as Record<string, unknown>;
  const styleConfig = (page.styleConfig ?? {}) as Record<string, unknown>;

  const rawPrimary = (
    (rawTheme.primaryColor as string) ??
    (rawTheme.primary_color as string) ??
    (styleConfig.primaryColor as string) ??
    (styleConfig.primary_color as string) ??
    ""
  ).trim();
  const primaryColor = rawPrimary || DEFAULT_PRIMARY_COLOR;
  const hasCustomPrimary =
    Boolean(rawPrimary) && rawPrimary.toUpperCase() !== DEFAULT_PRIMARY_COLOR;

  const rawButtonStyle =
    (rawTheme.buttonStyle as string) ?? (rawTheme.button_style as string) ?? "rounded";
  const buttonStyle: "rounded" | "square" | "pill" =
    rawButtonStyle === "square" || rawButtonStyle === "pill" ? rawButtonStyle : "rounded";

  const rawMode = rawTheme.mode as string | undefined;
  const themeMode: "system" | "light" | "dark" =
    rawMode === "light" || rawMode === "dark" ? rawMode : "system";
  const bgRaw = (
    (rawTheme.backgroundColor as string) ??
    (rawTheme.background_color as string) ??
    (styleConfig.backgroundColor as string) ??
    (styleConfig.background_color as string) ??
    ""
  ).trim();
  const textRaw = (
    (rawTheme.textColor as string) ??
    (rawTheme.text_color as string) ??
    (styleConfig.textColor as string) ??
    (styleConfig.text_color as string) ??
    ""
  ).trim();

  // Trang tùy biến giữ được chế độ tự động theo hệ thống trừ khi chọn cứng Sáng hoặc Tối.
  let isDark = false;
  if (themeMode === "dark") {
    isDark = true;
  } else if (themeMode === "light") {
    isDark = false;
  } else if (systemResolvedTheme === "dark" || systemResolvedTheme === "light") {
    // Chế độ "system": luôn ăn theo Light/Dark hiện tại của hệ thống
    isDark = systemResolvedTheme === "dark";
  } else {
    isDark = bgRaw ? !isLightHexColor(bgRaw) : false;
  }

  const pageThemeScope: "light" | "dark" | undefined =
    themeMode === "system" ? undefined : isDark ? "dark" : "light";

  const normalizedBg = normalizeHexColor(bgRaw) ?? bgRaw.toLowerCase();
  const normalizedText = normalizeHexColor(textRaw) ?? textRaw.toLowerCase();
  const bgMatchesPolarity =
    Boolean(bgRaw) && (isDark ? !isLightHexColor(bgRaw) : isLightHexColor(bgRaw));
  const textMatchesPolarity =
    Boolean(textRaw) && (isDark ? isLightHexColor(textRaw) : !isLightHexColor(textRaw));

  // Bỏ qua màu nền/chữ trung tính mặc định để kế thừa trực tiếp token chuẩn từ globals.css
  const useCustomBg = bgMatchesPolarity && !NEUTRAL_DEFAULT_BACKGROUNDS.has(normalizedBg);
  const useCustomText =
    textMatchesPolarity && (useCustomBg || !NEUTRAL_DEFAULT_TEXTS.has(normalizedText));

  const primaryForeground = isLightHexColor(primaryColor) ? "#0f172a" : "#ffffff";
  const customStyle: Record<string, string> = {};

  if (pageThemeScope) {
    customStyle.colorScheme = pageThemeScope;
  }

  if (hasCustomPrimary) {
    customStyle["--primary"] = primaryColor;
    customStyle["--primary-foreground"] = primaryForeground;
    customStyle["--primary-hover"] = isDark
      ? mixHexColor(primaryColor, "#ffffff", 0.14)
      : mixHexColor(primaryColor, "#000000", 0.14);
    customStyle["--primary-light"] = isDark
      ? mixHexColor(primaryColor, "#09090b", 0.78)
      : mixHexColor(primaryColor, "#ffffff", 0.9);
    customStyle["--page-primary"] = primaryColor;
    customStyle["--ring"] = primaryColor;
  }

  if (useCustomBg) {
    customStyle.backgroundColor = bgRaw;
    customStyle["--background"] = bgRaw;
    if (isDark) {
      const darkCard = mixHexColor(bgRaw, "#ffffff", 0.06);
      const darkMuted = mixHexColor(bgRaw, "#ffffff", 0.1);
      const darkBorder = mixHexColor(bgRaw, "#ffffff", 0.16);
      customStyle["--card"] = darkCard;
      customStyle["--popover"] = darkCard;
      customStyle["--secondary"] = darkMuted;
      customStyle["--accent"] = mixHexColor(bgRaw, "#ffffff", 0.12);
      customStyle["--muted"] = darkMuted;
      customStyle["--border"] = darkBorder;
      customStyle["--input"] = mixHexColor(bgRaw, "#ffffff", 0.18);
    } else {
      const lightMuted = mixHexColor(bgRaw, "#000000", 0.04);
      const lightBorder = mixHexColor(bgRaw, "#000000", 0.1);
      customStyle["--card"] = "#ffffff";
      customStyle["--popover"] = "#ffffff";
      customStyle["--secondary"] = lightMuted;
      customStyle["--accent"] = mixHexColor(bgRaw, "#000000", 0.05);
      customStyle["--muted"] = lightMuted;
      customStyle["--border"] = lightBorder;
      customStyle["--input"] = mixHexColor(bgRaw, "#000000", 0.12);
    }
  }

  if (useCustomText) {
    customStyle.color = textRaw;
    customStyle["--foreground"] = textRaw;
    customStyle["--card-foreground"] = textRaw;
    customStyle["--popover-foreground"] = textRaw;
    customStyle["--secondary-foreground"] = textRaw;
    customStyle["--accent-foreground"] = textRaw;
  }

  return {
    isDark,
    pageThemeScope,
    primaryColor,
    primaryForeground,
    buttonStyle,
    customStyle: customStyle as CSSProperties,
  };
}
