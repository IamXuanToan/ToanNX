import type { PageStyleConfig } from "../types/page.types";

export interface ThemePreset {
  name: string;
  primary: string;
  bg: string;
  text: string;
  buttonStyle: "rounded" | "pill" | "square";
  mode?: "system" | "light" | "dark";
  /** Cấu hình giao diện mở rộng (gradient, glass, hover, font...). */
  styleConfig?: Partial<PageStyleConfig>;
}

export const THEME_PRESETS: ThemePreset[] = [
  // 1. CỤM GIAO DIỆN SÁNG (Light Themes - 19 bộ màu)
  // --- Tông xanh thiên nhiên & tươi mát ---
  {
    name: "Emerald Green",
    primary: "#3D812E",
    bg: "#FFFFFF",
    text: "#1E293B",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Matcha Forest",
    primary: "#15803D",
    bg: "#F0FDF4",
    text: "#14532D",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Mint Fresh",
    primary: "#0D9488",
    bg: "#F0FDFA",
    text: "#134E4A",
    buttonStyle: "rounded",
    mode: "light",
  },

  // --- Tông xanh đại dương & bầu trời ---
  {
    name: "Modern Indigo",
    primary: "#4F46E5",
    bg: "#FAFAFA",
    text: "#0F172A",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Deep Ocean",
    primary: "#0284C7",
    bg: "#F8FAFC",
    text: "#0F172A",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Royal Sapphire",
    primary: "#2563EB",
    bg: "#EFF6FF",
    text: "#1E3A8A",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Arctic Cyan",
    primary: "#06B6D4",
    bg: "#ECFEFF",
    text: "#164E63",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Glacier Ice",
    primary: "#0EA5E9",
    bg: "#E0F2FE",
    text: "#0C4A6E",
    buttonStyle: "rounded",
    mode: "light",
  },

  // --- Tông cam, nâu & ấm áp ---
  {
    name: "Warm Sunset",
    primary: "#EA580C",
    bg: "#FFFDFB",
    text: "#1C1917",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Sunny Honey",
    primary: "#D97706",
    bg: "#FFFBEB",
    text: "#78350F",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Pastel Peach",
    primary: "#F97316",
    bg: "#FFF7ED",
    text: "#7C2D12",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Coffee Latte",
    primary: "#854D0E",
    bg: "#FEFCE8",
    text: "#422006",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Vintage Caramel",
    primary: "#B45309",
    bg: "#FFFBEB",
    text: "#451A03",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Copper Bronze",
    primary: "#C2410C",
    bg: "#FEF2F2",
    text: "#431407",
    buttonStyle: "rounded",
    mode: "light",
  },

  // --- Tông hồng, tím thanh lịch ---
  {
    name: "Rose Gold",
    primary: "#E11D48",
    bg: "#FFF1F2",
    text: "#4C0519",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Coral Reef",
    primary: "#FB7185",
    bg: "#FFF1F2",
    text: "#881337",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Sakura Blossom",
    primary: "#EC4899",
    bg: "#FDF2F8",
    text: "#831843",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Pastel Lavender",
    primary: "#8B5CF6",
    bg: "#F5F3FF",
    text: "#2E1065",
    buttonStyle: "pill",
    mode: "light",
  },

  // --- Tông xám tối giản hiện đại ---
  {
    name: "Nordic Slate",
    primary: "#475569",
    bg: "#F1F5F9",
    text: "#0F172A",
    buttonStyle: "square",
    mode: "light",
  },

  // 2. CỤM GIAO DIỆN TỐI (Dark Themes - 15 bộ màu)
  // --- Tối giản & Đơn sắc huyền bí ---
  {
    name: "Minimalist Dark",
    primary: "#FFFFFF",
    bg: "#09090B",
    text: "#F4F4F5",
    buttonStyle: "square",
    mode: "dark",
  },
  {
    name: "Charcoal Mono",
    primary: "#94A3B8",
    bg: "#111827",
    text: "#F9FAFB",
    buttonStyle: "rounded",
    mode: "dark",
  },

  // --- Đêm sâu & Vũ trụ ---
  {
    name: "Midnight Ocean",
    primary: "#38BDF8",
    bg: "#0F172A",
    text: "#F8FAFC",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Tokyo Night",
    primary: "#7AA2F7",
    bg: "#1A1B26",
    text: "#C0CAF5",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Deep Space",
    primary: "#6366F1",
    bg: "#0B0F19",
    text: "#E0E7FF",
    buttonStyle: "rounded",
    mode: "dark",
  },

  // --- Cyberpunk & Neon phát sáng ---
  {
    name: "Cyberpunk Neon",
    primary: "#A855F7",
    bg: "#180828",
    text: "#FAF5FF",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Neon Hacker",
    primary: "#22C55E",
    bg: "#022C22",
    text: "#DCFCE7",
    buttonStyle: "square",
    mode: "dark",
  },
  {
    name: "Electric Lime",
    primary: "#84CC16",
    bg: "#0A1F05",
    text: "#ECFCCB",
    buttonStyle: "square",
    mode: "dark",
  },
  {
    name: "Synthwave Sunset",
    primary: "#F43F5E",
    bg: "#1E1B4B",
    text: "#FFE4E6",
    buttonStyle: "pill",
    mode: "dark",
  },

  // --- Rừng đêm huyền ảo ---
  {
    name: "Emerald Forest Dark",
    primary: "#4ADE80",
    bg: "#052E16",
    text: "#F0FDF4",
    buttonStyle: "rounded",
    mode: "dark",
  },

  // --- Rượu vang & Nhung đỏ quý phái ---
  {
    name: "Crimson Velvet",
    primary: "#FB7185",
    bg: "#1F040A",
    text: "#FFE4E6",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Velvet Wine",
    primary: "#BE123C",
    bg: "#20040E",
    text: "#FFE4E6",
    buttonStyle: "rounded",
    mode: "dark",
  },

  // --- Hoàng gia & Sang trọng ---
  {
    name: "Obsidian Gold",
    primary: "#FBBF24",
    bg: "#18181B",
    text: "#FEF3C7",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Mocha Dark",
    primary: "#A26A42",
    bg: "#29180C",
    text: "#FEF3C7",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Amethyst Luxury",
    primary: "#C084FC",
    bg: "#1E1035",
    text: "#F3E8FF",
    buttonStyle: "pill",
    mode: "dark",
  },

  // --- Phong cách Beacons / Bento / Neo-Brutalism nâng cao ---
  {
    name: "Aurora Glass",
    primary: "#818CF8",
    bg: "#0F172A",
    text: "#F8FAFC",
    buttonStyle: "rounded",
    mode: "dark",
    styleConfig: {
      backgroundType: "gradient",
      gradientType: "linear",
      gradientAngle: 135,
      gradientColors: ["#0F172A", "#1E1B4B", "#312E81"],
      ambientMotion: "floating_orbs",
      surfaceStyle: "glass",
      hoverEffect: "shine",
      entranceAnimation: "fade_up",
      fontFamily: "plus_jakarta",
      linkLayout: "thumbnail_card",
    },
  },
  {
    name: "Sunset Creator",
    primary: "#F43F5E",
    bg: "#FFF1F2",
    text: "#4C0519",
    buttonStyle: "pill",
    mode: "light",
    styleConfig: {
      backgroundType: "gradient",
      gradientType: "linear",
      gradientAngle: 150,
      gradientColors: ["#FFF1F2", "#FFE4E6", "#FECDD3"],
      ambientMotion: "gradient_flow",
      surfaceStyle: "elevated",
      hoverEffect: "lift",
      entranceAnimation: "fade_up",
      fontFamily: "be_vietnam",
      linkLayout: "featured_hero",
    },
  },
  {
    name: "Neo Brutalism",
    primary: "#EAB308",
    bg: "#FEFCE8",
    text: "#18181B",
    buttonStyle: "square",
    mode: "light",
    styleConfig: {
      backgroundType: "pattern",
      patternKey: "dots",
      ambientMotion: "none",
      surfaceStyle: "hard_shadow",
      hoverEffect: "hard_push",
      cardRadius: "4px",
      fontFamily: "jetbrains_mono",
      linkLayout: "classic_bar",
    },
  },
  {
    name: "Minimal Editorial",
    primary: "#18181B",
    bg: "#FAF9F6",
    text: "#18181B",
    buttonStyle: "rounded",
    mode: "light",
    styleConfig: {
      backgroundType: "solid",
      headerLayout: "editorial_left",
      surfaceStyle: "outline",
      hoverEffect: "scale",
      fontFamily: "playfair",
      linkLayout: "bento_grid",
    },
  },
  {
    name: "Matcha Mist",
    primary: "#15803D",
    bg: "#ECFDF5",
    text: "#14532D",
    buttonStyle: "rounded",
    mode: "light",
    styleConfig: {
      backgroundType: "pattern",
      patternKey: "aura",
      ambientMotion: "floating_orbs",
      surfaceStyle: "glass",
      hoverEffect: "lift",
      fontFamily: "plus_jakarta",
      linkLayout: "grid_2col",
    },
  },
  {
    name: "Cyber Glow",
    primary: "#22D3EE",
    bg: "#09090B",
    text: "#ECFEFF",
    buttonStyle: "rounded",
    mode: "dark",
    styleConfig: {
      backgroundType: "pattern",
      patternKey: "grid",
      ambientMotion: "none",
      surfaceStyle: "glass",
      hoverEffect: "glow",
      highlightEffect: "pulse_ring",
      fontFamily: "jetbrains_mono",
      linkLayout: "bento_grid",
    },
  },
];
