import type { CSSProperties } from "react";

import { PAGE_PATTERN_KEYS, type PagePatternKey } from "./page-patterns";
import type { PageStyleConfig, PublicPage } from "../types/page.types";

/** Cấu hình giao diện mở rộng đã chuẩn hóa giá trị mặc định. */
export interface ResolvedAppearance {
  backgroundType: "solid" | "gradient" | "image" | "pattern";
  gradientType: "linear" | "radial";
  gradientAngle: number;
  gradientColors: string[];
  patternKey: PagePatternKey;
  backgroundFit: "cover" | "contain" | "tile";
  backgroundBlur: number;
  overlayColor: string;
  overlayOpacity: number;
  ambientMotion: "none" | "gradient_flow" | "floating_orbs";
  headerLayout: "centered" | "banner_overlap" | "hero_card" | "editorial_left";
  avatarShape: "circle" | "squircle" | "square";
  avatarSize: "sm" | "md" | "lg";
  avatarRing: "none" | "solid" | "gradient_glow";
  showVerifiedBadge: boolean;
  statusPill: string;
  coverHeight: "sm" | "md" | "lg";
  coverFade: boolean;
  socialPosition: "top" | "bottom" | "hidden";
  socialStyle: "pill" | "circle_outline" | "minimal";
  showShareButton: boolean;
  surfaceStyle: "solid" | "outline" | "soft" | "glass" | "elevated" | "hard_shadow";
  cardRadius: "0px" | "4px" | "8px" | "12px" | "20px";
  cardShadow: "none" | "sm" | "md" | "lg";
  hoverEffect: "none" | "lift" | "scale" | "glow" | "shine" | "hard_push";
  entranceAnimation: "none" | "fade_up" | "scale_in" | "blur_in";
  highlightEffect: "none" | "pulse_ring" | "wiggle" | "shimmer";
  linkLayout:
    | "classic_bar"
    | "thumbnail_card"
    | "featured_hero"
    | "grid_2col"
    | "bento_grid"
    | "compact_pills";
  buttonTextAlign: "left" | "center";
  layout: "grid" | "list" | "links" | "carousel_featured";
  cardDensity: "compact" | "standard" | "detailed";
  imageAspectRatio: "1:1" | "4:3" | "16:9" | "4:5";
  ctaStyle: "full_button" | "icon_circle" | "inline_arrow";
  showDiscountBadge: boolean;
  showPlatformBadge: boolean;
  stickyFilterBar: boolean;
  qrCardStyle: "fintech_glass" | "split_modern" | "minimal_card";
  presetButtonStyle: "gift_cards" | "pill_tags" | "compact_grid";
  leaderboardStyle: "podium" | "list" | "hidden";
  fontFamily: "inter" | "plus_jakarta" | "be_vietnam" | "playfair" | "jetbrains_mono";
  containerWidth: "compact" | "standard" | "wide";
  blockSpacing: "compact" | "normal" | "relaxed";
  footerStyle: "minimal" | "pill" | "hidden";
}

/**
 * Kết quả chuẩn hóa giao diện (light/dark, biến CSS, hiệu ứng và bố cục) cho trang công khai.
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
  /** Toàn bộ cấu hình hiển thị & hiệu ứng đã chuẩn hóa. */
  appearance: ResolvedAppearance;
  /** Class bề mặt cho card/button dựa trên `surfaceStyle`. */
  surfaceClass: string;
  /** Class hiệu ứng hover cho card/button. */
  hoverClass: string;
  /** Class hiệu ứng xuất hiện cho card/button. */
  entranceClass: string;
  /** Class hiệu ứng nhấn mạnh cho mục nổi bật. */
  highlightClass: string;
  /** Class độ rộng khung chứa chính. */
  containerWidthClass: string;
  /** Class khoảng cách giữa các khối. */
  blockGapClass: string;
  /** Class bo góc thẻ. */
  cardRadiusClass: string;
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
const FONT_STACKS: Record<ResolvedAppearance["fontFamily"], string> = {
  inter: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  plus_jakarta: "var(--font-plus-jakarta), var(--font-sans), sans-serif",
  be_vietnam: "var(--font-be-vietnam), var(--font-sans), sans-serif",
  playfair: "var(--font-playfair), Georgia, serif",
  jetbrains_mono: "var(--font-jetbrains-mono), ui-monospace, monospace",
};

function resolveAppearance(raw: Record<string, unknown>, isDark: boolean): ResolvedAppearance {
  const s = raw as PageStyleConfig;
  const pick = <T extends string>(val: unknown, allowed: readonly T[], fallback: T): T =>
    typeof val === "string" && (allowed as readonly string[]).includes(val) ? (val as T) : fallback;

  const rawColors = Array.isArray(s.gradientColors) ? s.gradientColors : [];
  const gradientColors =
    rawColors.length >= 2 && rawColors.every((c) => typeof c === "string")
      ? (rawColors as string[]).slice(0, 3)
      : isDark
        ? ["#0F172A", "#1E1B4B", "#312E81"]
        : ["#F0FDF4", "#DCFCE7", "#BBF7D0"];

  return {
    backgroundType: pick(s.backgroundType, ["solid", "gradient", "image", "pattern"], "solid"),
    gradientType: pick(s.gradientType, ["linear", "radial"], "linear"),
    gradientAngle:
      typeof s.gradientAngle === "number" ? Math.min(360, Math.max(0, s.gradientAngle)) : 135,
    gradientColors,
    patternKey: pick(s.patternKey, PAGE_PATTERN_KEYS, "dots"),
    backgroundFit: pick(s.backgroundFit, ["cover", "contain", "tile"], "cover"),
    backgroundBlur:
      typeof s.backgroundBlur === "number" ? Math.min(24, Math.max(0, s.backgroundBlur)) : 0,
    overlayColor: typeof s.overlayColor === "string" && s.overlayColor ? s.overlayColor : "#000000",
    overlayOpacity:
      typeof s.overlayOpacity === "number" ? Math.min(85, Math.max(0, s.overlayOpacity)) : 35,
    ambientMotion: pick(s.ambientMotion, ["none", "gradient_flow", "floating_orbs"], "none"),
    headerLayout: pick(
      s.headerLayout,
      ["centered", "banner_overlap", "hero_card", "editorial_left"],
      "centered",
    ),
    avatarShape: pick(s.avatarShape, ["circle", "squircle", "square"], "circle"),
    avatarSize: pick(s.avatarSize, ["sm", "md", "lg"], "md"),
    avatarRing: pick(s.avatarRing, ["none", "solid", "gradient_glow"], "solid"),
    showVerifiedBadge: s.showVerifiedBadge !== false,
    statusPill: typeof s.statusPill === "string" ? s.statusPill.trim() : "",
    coverHeight: pick(s.coverHeight, ["sm", "md", "lg"], "md"),
    coverFade: s.coverFade !== false,
    socialPosition: pick(s.socialPosition, ["top", "bottom", "hidden"], "top"),
    socialStyle: pick(s.socialStyle, ["pill", "circle_outline", "minimal"], "pill"),
    showShareButton: s.showShareButton !== false,
    surfaceStyle: pick(
      s.surfaceStyle,
      ["solid", "outline", "soft", "glass", "elevated", "hard_shadow"],
      "solid",
    ),
    cardRadius: pick(s.cardRadius, ["0px", "4px", "8px", "12px", "20px"], "12px"),
    cardShadow: pick(s.cardShadow, ["none", "sm", "md", "lg"], "sm"),
    hoverEffect: pick(
      s.hoverEffect,
      ["none", "lift", "scale", "glow", "shine", "hard_push"],
      "lift",
    ),
    entranceAnimation: pick(
      s.entranceAnimation,
      ["none", "fade_up", "scale_in", "blur_in"],
      "none",
    ),
    highlightEffect: pick(s.highlightEffect, ["none", "pulse_ring", "wiggle", "shimmer"], "none"),
    linkLayout: pick(
      s.linkLayout,
      [
        "classic_bar",
        "thumbnail_card",
        "featured_hero",
        "grid_2col",
        "bento_grid",
        "compact_pills",
      ],
      "classic_bar",
    ),
    buttonTextAlign: pick(s.buttonTextAlign, ["left", "center"], "left"),
    layout: pick(s.layout, ["grid", "list", "links", "carousel_featured"], "grid"),
    cardDensity: pick(s.cardDensity, ["compact", "standard", "detailed"], "standard"),
    imageAspectRatio: pick(s.imageAspectRatio, ["1:1", "4:3", "16:9", "4:5"], "1:1"),
    ctaStyle: pick(s.ctaStyle, ["full_button", "icon_circle", "inline_arrow"], "full_button"),
    showDiscountBadge: s.showDiscountBadge !== false,
    showPlatformBadge: s.showPlatformBadge !== false,
    stickyFilterBar: s.stickyFilterBar !== false,
    qrCardStyle: pick(
      s.qrCardStyle,
      ["fintech_glass", "split_modern", "minimal_card"],
      "split_modern",
    ),
    presetButtonStyle: pick(
      s.presetButtonStyle,
      ["gift_cards", "pill_tags", "compact_grid"],
      "gift_cards",
    ),
    leaderboardStyle: pick(s.leaderboardStyle, ["podium", "list", "hidden"], "podium"),
    fontFamily: pick(
      s.fontFamily,
      ["inter", "plus_jakarta", "be_vietnam", "playfair", "jetbrains_mono"],
      "inter",
    ),
    containerWidth: pick(s.containerWidth, ["compact", "standard", "wide"], "standard"),
    blockSpacing: pick(s.blockSpacing, ["compact", "normal", "relaxed"], "normal"),
    footerStyle: pick(s.footerStyle, ["minimal", "pill", "hidden"], "minimal"),
  };
}

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

  const appearance = resolveAppearance(styleConfig, isDark);
  customStyle.fontFamily = FONT_STACKS[appearance.fontFamily];

  const surfaceMap: Record<ResolvedAppearance["surfaceStyle"], string> = {
    solid: "bg-card text-card-foreground border border-border/80 shadow-xs",
    outline: "bg-transparent text-foreground border-2 border-border hover:border-primary/60",
    soft: "bg-primary/10 text-foreground border border-primary/20",
    glass: "bg-card/75 text-card-foreground border border-border/70 backdrop-blur-md shadow-sm",
    elevated: "bg-card text-card-foreground border border-border/60 shadow-md",
    hard_shadow: "bg-card text-card-foreground border page-surface-hard_shadow",
  };

  const hoverMap: Record<ResolvedAppearance["hoverEffect"], string> = {
    none: "",
    lift: "page-hover-lift",
    scale: "page-hover-scale",
    glow: "page-hover-glow",
    shine: "page-hover-shine",
    hard_push: "page-hover-hard_push",
  };

  const entranceMap: Record<ResolvedAppearance["entranceAnimation"], string> = {
    none: "",
    fade_up: "page-enter-fade_up",
    scale_in: "page-enter-scale_in",
    blur_in: "page-enter-blur_in",
  };

  const highlightMap: Record<ResolvedAppearance["highlightEffect"], string> = {
    none: "",
    pulse_ring: "page-highlight-pulse_ring",
    wiggle: "page-highlight-wiggle",
    shimmer: "page-highlight-shimmer",
  };

  const widthMap: Record<ResolvedAppearance["containerWidth"], string> = {
    compact: "max-w-md",
    standard: "max-w-xl",
    wide: "max-w-4xl",
  };

  const gapMap: Record<ResolvedAppearance["blockSpacing"], string> = {
    compact: "space-y-2.5",
    normal: "space-y-3.5",
    relaxed: "space-y-5",
  };

  const radiusMap: Record<ResolvedAppearance["cardRadius"], string> = {
    "0px": "rounded-none",
    "4px": "rounded",
    "8px": "rounded-lg",
    "12px": "rounded-xl",
    "20px": "rounded-2xl",
  };

  return {
    isDark,
    pageThemeScope,
    primaryColor,
    primaryForeground,
    buttonStyle,
    appearance,
    surfaceClass: surfaceMap[appearance.surfaceStyle],
    hoverClass: hoverMap[appearance.hoverEffect],
    entranceClass: entranceMap[appearance.entranceAnimation],
    highlightClass: highlightMap[appearance.highlightEffect],
    containerWidthClass: widthMap[appearance.containerWidth],
    blockGapClass: gapMap[appearance.blockSpacing],
    cardRadiusClass: radiusMap[appearance.cardRadius],
    customStyle: customStyle as CSSProperties,
  };
}
