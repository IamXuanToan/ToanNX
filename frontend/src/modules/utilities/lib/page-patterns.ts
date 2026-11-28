import type { CSSProperties } from "react";

export const PAGE_PATTERN_KEYS = [
  "dots",
  "grid",
  "mesh",
  "diagonal",
  "aura",
  "top_spotlight",
  "bottom_glow",
  "grid_fade",
  "dot_fade",
  "dashed_grid",
  "isometric",
  "checker_soft",
  "crosshatch",
  "concentric",
  "sunset_horizon",
  "cyber_horizon",
  "aurora_beams",
  "blueprint",
  "paper_grain",
  "duotone_corner",
] as const;

export type PagePatternKey = (typeof PAGE_PATTERN_KEYS)[number];

export interface ColoredBackdropPreset {
  id: string;
  mode: "light" | "dark";
  bg: string;
  text: string;
  primary: string;
  patternKey: PagePatternKey;
}

/** Bộ nền có màu sẵn lấy cảm hứng từ PatternCraft (1 click áp nền + màu chữ tương phản chuẩn). */
export const COLORED_BACKDROP_PRESETS: ColoredBackdropPreset[] = [
  {
    id: "emerald_dark_glow",
    mode: "dark",
    bg: "#020617",
    text: "#F8FAFC",
    primary: "#10B981",
    patternKey: "top_spotlight",
  },
  {
    id: "violet_cosmic_mesh",
    mode: "dark",
    bg: "#0F0728",
    text: "#F5F3FF",
    primary: "#A855F7",
    patternKey: "mesh",
  },
  {
    id: "crimson_aura_dark",
    mode: "dark",
    bg: "#09090B",
    text: "#FFF1F2",
    primary: "#F43F5E",
    patternKey: "aura",
  },
  {
    id: "midnight_blueprint",
    mode: "dark",
    bg: "#020617",
    text: "#E0F2FE",
    primary: "#38BDF8",
    patternKey: "blueprint",
  },
  {
    id: "cyber_amber_dots",
    mode: "dark",
    bg: "#0A0A0A",
    text: "#FEF3C7",
    primary: "#F59E0B",
    patternKey: "dot_fade",
  },
  {
    id: "indigo_cyber_horizon",
    mode: "dark",
    bg: "#0B1120",
    text: "#E2E8F0",
    primary: "#6366F1",
    patternKey: "cyber_horizon",
  },
  {
    id: "warm_paper_cream",
    mode: "light",
    bg: "#FAF8F1",
    text: "#1C1917",
    primary: "#B45309",
    patternKey: "paper_grain",
  },
  {
    id: "sunset_peach_glow",
    mode: "light",
    bg: "#FFF7ED",
    text: "#431407",
    primary: "#EA580C",
    patternKey: "sunset_horizon",
  },
  {
    id: "mint_pastel_aura",
    mode: "light",
    bg: "#F0FDFA",
    text: "#134E4A",
    primary: "#0D9488",
    patternKey: "aurora_beams",
  },
  {
    id: "soft_lavender_grid",
    mode: "light",
    bg: "#F5F3FF",
    text: "#2E1065",
    primary: "#7C3AED",
    patternKey: "grid_fade",
  },
  {
    id: "rose_duotone_light",
    mode: "light",
    bg: "#FFF1F2",
    text: "#4C0519",
    primary: "#E11D48",
    patternKey: "duotone_corner",
  },
  {
    id: "sky_isometric_clean",
    mode: "light",
    bg: "#F0F9FF",
    text: "#0C4A6E",
    primary: "#0284C7",
    patternKey: "isometric",
  },
];

/**
 * Tạo CSS inline cho 20 kiểu nền CSS thuần lấy cảm hứng từ PatternCraft.
 * Tự thích ứng theo `--foreground`, `--primary`, `--ring` của theme trang.
 *
 * @param patternKey - Mã họa tiết.
 * @returns CSSProperties áp dụng lên lớp nền hoặc ô preview.
 */
export function buildPatternStyle(patternKey: PagePatternKey): CSSProperties {
  switch (patternKey) {
    case "dots":
      return {
        backgroundImage:
          "radial-gradient(color-mix(in srgb, var(--foreground) 15%, transparent) 1.25px, transparent 1.25px)",
        backgroundSize: "20px 20px",
      };
    case "grid":
      return {
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      };
    case "diagonal":
      return {
        backgroundImage:
          "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--foreground) 7%, transparent) 0, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px, transparent 14px)",
      };
    case "mesh":
      return {
        backgroundImage:
          "radial-gradient(at 18% 15%, color-mix(in srgb, var(--primary) 30%, transparent) 0px, transparent 52%), radial-gradient(at 84% 22%, color-mix(in srgb, var(--ring) 24%, transparent) 0px, transparent 48%), radial-gradient(at 52% 88%, color-mix(in srgb, var(--primary) 22%, transparent) 0px, transparent 55%)",
      };
    case "top_spotlight":
      return {
        backgroundImage:
          "radial-gradient(ellipse 90% 55% at 50% 0%, color-mix(in srgb, var(--primary) 32%, transparent), transparent 72%)",
      };
    case "bottom_glow":
      return {
        backgroundImage:
          "radial-gradient(ellipse 90% 55% at 50% 100%, color-mix(in srgb, var(--primary) 32%, transparent), transparent 72%)",
      };
    case "grid_fade":
      return {
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--foreground) 10%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 10%, transparent) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
        maskImage: "radial-gradient(ellipse 75% 65% at 50% 35%, #000 50%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 35%, #000 50%, transparent 100%)",
      };
    case "dot_fade":
      return {
        backgroundImage:
          "radial-gradient(color-mix(in srgb, var(--foreground) 18%, transparent) 1.3px, transparent 1.3px)",
        backgroundSize: "18px 18px",
        maskImage: "radial-gradient(ellipse 72% 62% at 50% 35%, #000 45%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 72% 62% at 50% 35%, #000 45%, transparent 100%)",
      };
    case "dashed_grid":
      return {
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--primary) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--primary) 16%, transparent) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        backgroundPosition: "center center",
      };
    case "isometric":
      return {
        backgroundImage:
          "linear-gradient(30deg, color-mix(in srgb, var(--foreground) 6%, transparent) 12%, transparent 12.5%, transparent 87%, color-mix(in srgb, var(--foreground) 6%, transparent) 87.5%, color-mix(in srgb, var(--foreground) 6%, transparent)), linear-gradient(150deg, color-mix(in srgb, var(--foreground) 6%, transparent) 12%, transparent 12.5%, transparent 87%, color-mix(in srgb, var(--foreground) 6%, transparent) 87.5%, color-mix(in srgb, var(--foreground) 6%, transparent)), linear-gradient(60deg, color-mix(in srgb, var(--primary) 6%, transparent) 25%, transparent 25.5%, transparent 75%, color-mix(in srgb, var(--primary) 6%, transparent) 75%, color-mix(in srgb, var(--primary) 6%, transparent))",
        backgroundSize: "28px 48px",
      };
    case "checker_soft":
      return {
        backgroundImage:
          "linear-gradient(45deg, color-mix(in srgb, var(--foreground) 5%, transparent) 25%, transparent 25%), linear-gradient(-45deg, color-mix(in srgb, var(--foreground) 5%, transparent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--foreground) 5%, transparent) 75%), linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--foreground) 5%, transparent) 75%)",
        backgroundSize: "24px 24px",
        backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
      };
    case "crosshatch":
      return {
        backgroundImage:
          "repeating-linear-gradient(45deg, color-mix(in srgb, var(--foreground) 6%, transparent) 0, color-mix(in srgb, var(--foreground) 6%, transparent) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, color-mix(in srgb, var(--foreground) 6%, transparent) 0, color-mix(in srgb, var(--foreground) 6%, transparent) 1px, transparent 1px, transparent 16px)",
      };
    case "concentric":
      return {
        backgroundImage:
          "repeating-radial-gradient(circle at 50% 25%, transparent 0, transparent 22px, color-mix(in srgb, var(--primary) 11%, transparent) 22px, color-mix(in srgb, var(--primary) 11%, transparent) 23.5px)",
      };
    case "sunset_horizon":
      return {
        backgroundImage:
          "radial-gradient(120% 60% at 50% 0%, color-mix(in srgb, var(--primary) 26%, transparent) 0%, transparent 65%), radial-gradient(85% 50% at 50% 100%, color-mix(in srgb, var(--ring) 22%, transparent) 0%, transparent 60%)",
      };
    case "cyber_horizon":
      return {
        backgroundImage:
          "radial-gradient(ellipse 80% 45% at 50% 15%, color-mix(in srgb, var(--primary) 28%, transparent), transparent 70%), linear-gradient(to right, color-mix(in srgb, var(--primary) 10%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--primary) 10%, transparent) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 32px 32px, 32px 32px",
      };
    case "aurora_beams":
      return {
        backgroundImage:
          "linear-gradient(125deg, color-mix(in srgb, var(--primary) 24%, transparent) 0%, transparent 42%), linear-gradient(240deg, color-mix(in srgb, var(--ring) 22%, transparent) 0%, transparent 48%), radial-gradient(circle at 50% 10%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%)",
      };
    case "blueprint":
      return {
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px), linear-gradient(to right, color-mix(in srgb, var(--primary) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--primary) 5%, transparent) 1px, transparent 1px)",
        backgroundSize: "64px 64px, 64px 64px, 16px 16px, 16px 16px",
      };
    case "paper_grain":
      return {
        backgroundImage:
          "linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px)",
        backgroundSize: "100% 24px",
      };
    case "duotone_corner":
      return {
        backgroundImage:
          "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--primary) 28%, transparent) 0%, transparent 48%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--ring) 24%, transparent) 0%, transparent 48%)",
      };
    case "aura":
    default:
      return {
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--primary) 26%, transparent), transparent 70%), radial-gradient(circle at 85% 85%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 45%)",
      };
  }
}
