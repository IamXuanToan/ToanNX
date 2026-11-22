/**
 * Hook quản lý tùy biến giao diện đọc truyện (cỡ chữ, giãn dòng, phông chữ, chủ đề, độ rộng).
 *
 * Dữ liệu được lưu trữ liên tục (persistent) vào `localStorage` của trình duyệt.
 */

"use client";

import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

import type { ReaderSettings } from "../types/novel.types";

/** Danh sách các kích cỡ font chữ khả dụng (từ nhỏ 12px đến lớn 40px). */
export const READER_FONT_SIZES = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40] as const;

/** Danh sách các khoảng cách dòng khả dụng (từ 1.2 đến 3.0). */
export const READER_LINE_HEIGHTS = [
  1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0,
] as const;

/** Danh sách các chủ đề màu sắc đọc truyện với class Tailwind tương ứng. */
export const READER_THEMES = {
  /** Giao diện sáng chuẩn: nền trắng, chữ xám đen */
  light: {
    id: "light" as const,
    nameKey: "lightTheme",
    bgClass: "bg-white text-slate-800",
    headerClass: "bg-white/90 border-slate-200 text-slate-800",
    footerClass: "bg-white/90 border-slate-200 text-slate-800",
    surfaceClass: "bg-slate-50 border-slate-200 text-slate-700",
  },
  /** Giao diện giấy cũ (Sepia): nền vàng ngà ấm áp, chữ nâu gỗ, giảm mỏi mắt khi đọc lâu */
  sepia: {
    id: "sepia" as const,
    nameKey: "sepiaTheme",
    bgClass: "bg-[#fbf0d9] text-[#4a3728]",
    headerClass: "bg-[#fbf0d9]/90 border-[#e6dac1] text-[#4a3728]",
    footerClass: "bg-[#fbf0d9]/90 border-[#e6dac1] text-[#4a3728]",
    surfaceClass: "bg-[#f4e5c7] border-[#e6dac1] text-[#4a3728]",
  },
  /** Giao diện xám đêm dịu: nền than xám, chữ xám khói */
  gray: {
    id: "gray" as const,
    nameKey: "grayTheme",
    bgClass: "bg-[#22272e] text-[#adbac7]",
    headerClass: "bg-[#22272e]/90 border-[#373e47] text-[#adbac7]",
    footerClass: "bg-[#22272e]/90 border-[#373e47] text-[#adbac7]",
    surfaceClass: "bg-[#2d333b] border-[#373e47] text-[#adbac7]",
  },
  /** Giao diện tối tuyệt đối (OLED Black): nền đen tuyền tiết kiệm pin, chữ trắng ngà */
  oled: {
    id: "oled" as const,
    nameKey: "oledTheme",
    bgClass: "bg-black text-[#d1d5db]",
    headerClass: "bg-black/90 border-[#262626] text-[#d1d5db]",
    footerClass: "bg-black/90 border-[#262626] text-[#d1d5db]",
    surfaceClass: "bg-[#171717] border-[#262626] text-[#d1d5db]",
  },
} as const;

/** Danh sách các họ phông chữ đọc truyện. */
export const READER_FONT_FAMILIES = {
  /** Phông có chân cổ điển (Merriweather / Serif), tối ưu cho tiểu thuyết văn học */
  serif: {
    id: "serif" as const,
    nameKey: "serifFont",
    fontClass: "font-serif",
  },
  /** Phông không chân hiện đại (Inter / Sans-serif), tối ưu cho đọc trên thiết bị di động */
  sans: {
    id: "sans" as const,
    nameKey: "sansFont",
    fontClass: "font-sans",
  },
  /** Phông đơn cách (Monospace) */
  mono: {
    id: "mono" as const,
    nameKey: "monoFont",
    fontClass: "font-mono",
  },
} as const;

/** Các độ rộng của khung nội dung bài đọc. */
export const READER_CONTENT_WIDTHS = {
  /** Khung đọc hẹp (max-w-2xl ~ 672px) */
  narrow: { id: "narrow" as const, maxWidthClass: "max-w-2xl" },
  /** Khung đọc chuẩn (max-w-3xl ~ 768px) */
  normal: { id: "normal" as const, maxWidthClass: "max-w-3xl" },
  /** Khung đọc rộng (max-w-5xl ~ 1024px) */
  wide: { id: "wide" as const, maxWidthClass: "max-w-5xl" },
} as const;

const SETTINGS_KEY = "novel_reader_settings";

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif",
  theme: "sepia",
  contentWidth: "normal",
};

/**
 * Kiểm tra xem dữ liệu đọc từ storage có khớp kiểu `ReaderSettings` hay không.
 *
 * @param value - Dữ liệu thô đọc từ localStorage.
 * @returns true nếu dữ liệu hợp lệ.
 */
function isValidSettings(value: unknown): value is ReaderSettings {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.fontSize === "number" &&
    typeof s.lineHeight === "number" &&
    typeof s.fontFamily === "string" &&
    typeof s.theme === "string" &&
    typeof s.contentWidth === "string"
  );
}

/**
 * Custom hook quản lý trạng thái đọc truyện với lưu trữ tự động.
 *
 * Cung cấp cài đặt hiện tại cùng các hàm tiện ích: tăng/giảm font size, tăng/giảm line height,
 * đặt lại mặc định.
 *
 * @returns Đối tượng điều khiển các cấu hình của trình đọc truyện.
 */
export function useReaderSettings() {
  const [settings, setSettings] = useStoredPreference<ReaderSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS,
    isValidSettings,
  );

  /**
   * Cập nhật một phần hoặc toàn bộ cài đặt đọc truyện.
   *
   * @param updates - Bản ghi các trường cần thay đổi.
   */
  const updateSettings = (updates: Partial<ReaderSettings>) => {
    setSettings({ ...settings, ...updates });
  };

  /** Tăng cỡ chữ lên nấc kế tiếp. */
  const increaseFontSize = () => {
    const currentIndex = READER_FONT_SIZES.indexOf(
      settings.fontSize as (typeof READER_FONT_SIZES)[number],
    );
    if (currentIndex !== -1 && currentIndex < READER_FONT_SIZES.length - 1) {
      updateSettings({ fontSize: READER_FONT_SIZES[currentIndex + 1] });
    }
  };

  /** Giảm cỡ chữ xuống nấc liền trước. */
  const decreaseFontSize = () => {
    const currentIndex = READER_FONT_SIZES.indexOf(
      settings.fontSize as (typeof READER_FONT_SIZES)[number],
    );
    if (currentIndex > 0) {
      updateSettings({ fontSize: READER_FONT_SIZES[currentIndex - 1] });
    }
  };

  /** Tăng độ giãn dòng lên nấc kế tiếp. */
  const increaseLineHeight = () => {
    const currentIndex = READER_LINE_HEIGHTS.indexOf(
      settings.lineHeight as (typeof READER_LINE_HEIGHTS)[number],
    );
    if (currentIndex !== -1 && currentIndex < READER_LINE_HEIGHTS.length - 1) {
      updateSettings({ lineHeight: READER_LINE_HEIGHTS[currentIndex + 1] });
    }
  };

  /** Giảm độ giãn dòng xuống nấc liền trước. */
  const decreaseLineHeight = () => {
    const currentIndex = READER_LINE_HEIGHTS.indexOf(
      settings.lineHeight as (typeof READER_LINE_HEIGHTS)[number],
    );
    if (currentIndex > 0) {
      updateSettings({ lineHeight: READER_LINE_HEIGHTS[currentIndex - 1] });
    }
  };

  /** Khôi phục cấu hình đọc truyện về giá trị ban đầu. */
  const resetToDefault = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    resetToDefault,
  };
}
