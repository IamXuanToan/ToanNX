/** Tọa độ và kích thước vùng cắt ảnh theo pixel từ thư viện crop. */
export type CropPixelArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Tùy chọn vị trí đóng dấu watermark. */
export type WatermarkPosition =
  "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

/** Cấu hình chi tiết cho watermark văn bản. */
export type WatermarkConfig = {
  enabled: boolean;
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  /** Màu chữ dạng `#RRGGBB`. */
  color: string;
};
