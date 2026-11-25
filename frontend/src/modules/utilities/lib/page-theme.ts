import type { CSSProperties } from "react";

import type { PublicPage } from "../types/page.types";

/**
 * Kết quả chuẩn hóa giao diện (light/dark, biến CSS) cho trang công khai.
 */
export interface ResolvedPageTheme {
  /** Có đang hiển thị ở nền tối hay không. */
  isDark: boolean;
  /** Màu nhấn chính của trang. */
  primaryColor: string;
  /** Màu chữ tương phản trên nền chính (`--primary-foreground`). */
  primaryForeground: string;
  /** Bo góc nút theo cấu hình (`rounded-none`, `rounded-full`, `rounded-2xl` / `rounded-xl`). */
  buttonStyle: "rounded" | "square" | "pill";
  /** Các CSS custom properties gắn trực tiếp lên phần tử gốc của trang. */
  customStyle: CSSProperties;
}

/**
 * Kiểm tra một mã màu HEX 6 ký tự có thuộc nhóm màu sáng hay không dựa theo độ sáng cảm nhận (luminance).
 *
 * @param hex - Mã màu HEX (ví dụ `#FFFFFF`).
 * @returns `true` nếu là màu sáng hoặc không phải HEX hợp lệ.
 */
export function isLightHexColor(hex?: string | null): boolean {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/**
 * Tính toán bộ màu và chế độ sáng/tối hiệu lực cho trang công khai, bảo đảm chế độ `system`
 * luôn ăn theo theme Light/Dark của hệ thống (từ `next-themes`) và đồng bộ đầy đủ biến `--ring`.
 *
 * @param page - Dữ liệu trang công khai.
 * @param options - Tùy chọn đọc thêm hệ thống hoặc ép kiểu bo nút mặc định.
 * @returns Thông số giao diện đã phân giải.
 */
export function resolvePageTheme(
  page: PublicPage,
  systemResolvedTheme?: string,
): ResolvedPageTheme {
  const rawTheme = (page.theme ?? {}) as Record<string, unknown>;
  const styleConfig = (page.styleConfig ?? {}) as Record<string, unknown>;

  const primaryColor =
    (rawTheme.primaryColor as string) ??
    (rawTheme.primary_color as string) ??
    (styleConfig.primaryColor as string) ??
    (styleConfig.primary_color as string) ??
    "#3D812E";

  const rawButtonStyle =
    (rawTheme.buttonStyle as string) ?? (rawTheme.button_style as string) ?? "rounded";
  const buttonStyle: "rounded" | "square" | "pill" =
    rawButtonStyle === "square" || rawButtonStyle === "pill" ? rawButtonStyle : "rounded";

  const themeMode = (rawTheme.mode as string) || "system";
  const bgRaw =
    (rawTheme.backgroundColor as string) ??
    (rawTheme.background_color as string) ??
    (styleConfig.backgroundColor as string) ??
    (styleConfig.background_color as string) ??
    "";
  const textRaw =
    (rawTheme.textColor as string) ??
    (rawTheme.text_color as string) ??
    (styleConfig.textColor as string) ??
    (styleConfig.text_color as string) ??
    "";

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

  // Chỉ giữ màu nền/chữ tùy chỉnh nếu hợp với cực sáng/tối hiệu lực (tránh nền trắng mặc định đè lên dark mode hệ thống)
  const useCustomBg = Boolean(bgRaw) && (isDark ? !isLightHexColor(bgRaw) : isLightHexColor(bgRaw));
  const useCustomText =
    Boolean(textRaw) && (isDark ? isLightHexColor(textRaw) : !isLightHexColor(textRaw));

  const resolvedBg = useCustomBg ? bgRaw : isDark ? "#09090b" : "#ffffff";
  const resolvedText = useCustomText ? textRaw : isDark ? "#f4f4f5" : "#0f172a";
  const resolvedCardBg = isDark ? "#18181b" : "#ffffff";
  const resolvedBorder = isDark ? "#27272a" : "#e2e8f0";
  const resolvedMuted = isDark ? "#27272a" : "#f1f5f9";
  const resolvedMutedForeground = isDark ? "#a1a1aa" : "#64748b";
  const primaryForeground = isLightHexColor(primaryColor) ? "#0f172a" : "#ffffff";

  const customStyle = {
    "--primary": primaryColor,
    "--primary-foreground": primaryForeground,
    "--page-primary": primaryColor,
    "--ring": primaryColor,
    colorScheme: isDark ? "dark" : "light",
    backgroundColor: resolvedBg,
    color: resolvedText,
    "--background": resolvedBg,
    "--foreground": resolvedText,
    "--card": resolvedCardBg,
    "--card-foreground": resolvedText,
    "--popover": resolvedCardBg,
    "--popover-foreground": resolvedText,
    "--secondary": resolvedMuted,
    "--secondary-foreground": resolvedText,
    "--accent": resolvedMuted,
    "--accent-foreground": resolvedText,
    "--border": resolvedBorder,
    "--input": resolvedBorder,
    "--muted": resolvedMuted,
    "--muted-foreground": resolvedMutedForeground,
  } as CSSProperties;

  return {
    isDark,
    primaryColor,
    primaryForeground,
    buttonStyle,
    customStyle,
  };
}
