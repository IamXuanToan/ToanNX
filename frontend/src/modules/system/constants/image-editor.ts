/** Kiểu cắt mặc định: giữ trọn ảnh gốc (chỉ xoay/chèn watermark, không cắt). */
export const ORIGINAL_CROP_ID = "original";

/** Tùy chọn hình dạng và tỉ lệ cắt ảnh; mục đầu (`original`) là mặc định. */
export const CROP_ASPECT_RATIOS = [
  { id: ORIGINAL_CROP_ID, labelKey: "cropShapeOriginal", aspect: undefined, isRound: false },
  { id: "free", labelKey: "cropShapeFree", aspect: undefined, isRound: false },
  { id: "square", labelKey: "cropShapeSquare", aspect: 1, isRound: false },
  { id: "round", labelKey: "cropShapeRound", aspect: 1, isRound: true },
  { id: "4_3", labelKey: "cropShape4_3", aspect: 4 / 3, isRound: false },
  { id: "16_9", labelKey: "cropShape16_9", aspect: 16 / 9, isRound: false },
] as const;

/** Vị trí chèn watermark trên hình ảnh. */
export const WATERMARK_POSITIONS = [
  { id: "bottom-right", labelKey: "watermarkPosBottomRight" },
  { id: "bottom-left", labelKey: "watermarkPosBottomLeft" },
  { id: "top-right", labelKey: "watermarkPosTopRight" },
  { id: "top-left", labelKey: "watermarkPosTopLeft" },
  { id: "center", labelKey: "watermarkPosCenter" },
] as const;

/** Mức thu phóng tối thiểu của khung cắt ảnh. */
export const MIN_CROP_ZOOM = 1;

/** Mức thu phóng tối đa của khung cắt ảnh. */
export const MAX_CROP_ZOOM = 3;

/** Bước nhảy khi thay đổi thu phóng. */
export const CROP_ZOOM_STEP = 0.1;

/**
 * Cỡ chữ watermark tính theo chiều rộng ảnh: px = chiều rộng × fontSize / WATERMARK_FONT_SCALE (28 ≈ 5,6%).
 * Xem trước (theo khung cắt trên màn hình) và ảnh xuất (theo vùng cắt thật) dùng cùng công thức nên khớp nhau.
 */
export const WATERMARK_FONT_SCALE = 500;
/** Cỡ chữ watermark: nhỏ nhất, lớn nhất, bước, mặc định (đơn vị theo `WATERMARK_FONT_SCALE`). */
export const WATERMARK_FONT_MIN = 10;
export const WATERMARK_FONT_MAX = 100;
export const WATERMARK_FONT_STEP = 2;
export const WATERMARK_FONT_DEFAULT = 28;
/** Cỡ chữ tối thiểu (px) trên ảnh xuất và trên xem trước, để chữ luôn đọc được. */
export const WATERMARK_MIN_OUTPUT_PX = 14;
export const WATERMARK_MIN_PREVIEW_PX = 8;
/** Độ mờ watermark (%): nhỏ nhất, lớn nhất, bước. */
export const WATERMARK_OPACITY_MIN = 10;
export const WATERMARK_OPACITY_MAX = 100;
export const WATERMARK_OPACITY_STEP = 5;

/** Màu chữ watermark mặc định và hai màu chọn nhanh (dữ liệu người dùng chọn, không phải màu giao diện). */
export const WATERMARK_COLOR_DEFAULT = "#FFFFFF";
export const WATERMARK_COLOR_PRESETS = [
  { value: "#FFFFFF", labelKey: "watermarkColorWhite" },
  { value: "#000000", labelKey: "watermarkColorBlack" },
] as const;
