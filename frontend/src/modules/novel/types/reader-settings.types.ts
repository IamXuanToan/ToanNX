/**
 * Định nghĩa cấu hình tùy biến giao diện đọc truyện (Reader Settings).
 */

/** Cấu hình tùy biến giao diện đọc truyện lưu trong local storage của độc giả. */
export type ReaderSettings = {
  /** Cỡ chữ (px) */
  fontSize: number;
  /** Độ giãn dòng (line-height) */
  lineHeight: number;
  /** Họ phông chữ */
  fontFamily: "serif" | "sans" | "mono";
  /** Chủ đề màu sắc */
  theme: "light" | "sepia" | "gray" | "oled";
  /** Độ rộng khung đọc */
  contentWidth: "narrow" | "normal" | "wide";
};
