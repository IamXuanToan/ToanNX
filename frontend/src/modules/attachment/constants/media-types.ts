/** Loại media khớp hợp đồng IMAGE/VIDEO/DOCUMENT của backend. */
export const MEDIA_KINDS = ["IMAGE", "VIDEO", "DOCUMENT"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Định dạng đã xác minh theo nội dung, không dựa vào phần đuôi do người upload đặt. */
export const MEDIA_FORMATS: { kind: MediaKind; value: string; label: string }[] = [
  { kind: "IMAGE", value: "image/png", label: "PNG (.png)" },
  { kind: "IMAGE", value: "image/jpeg", label: "JPEG (.jpg, .jpeg)" },
  { kind: "IMAGE", value: "image/webp", label: "WebP (.webp)" },
  { kind: "IMAGE", value: "image/gif", label: "GIF (.gif)" },
  { kind: "IMAGE", value: "image/svg+xml", label: "SVG (.svg)" },
  { kind: "VIDEO", value: "video/mp4", label: "MP4 (.mp4)" },
  { kind: "VIDEO", value: "video/quicktime", label: "MOV (.mov)" },
  { kind: "VIDEO", value: "video/webm", label: "WebM (.webm)" },
  { kind: "DOCUMENT", value: "application/pdf", label: "PDF (.pdf)" },
];

export const UNFILED_FOLDER = "UNFILED";

/** @param kinds - Loại đang lọc. @returns Chỉ các định dạng tương ứng với loại đã chọn. */
export function mediaFormatsFor(kinds: readonly string[]) {
  return MEDIA_FORMATS.filter((format) => !kinds.length || kinds.includes(format.kind));
}

/** @param kinds - Loại mới. @param values - Định dạng cũ. @returns Loại bỏ định dạng không còn tương thích. */
export function normalizeMediaFormats(kinds: readonly string[], values: readonly string[]) {
  const allowed = mediaFormatsFor(kinds).map((format) => format.value);
  return values.filter((value) => allowed.includes(value));
}
