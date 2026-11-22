import { WATERMARK_FONT_SCALE, WATERMARK_MIN_OUTPUT_PX } from "../constants/image-editor";
import type { CropPixelArea, WatermarkConfig } from "../types/image-editor.types";
import { watermarkShadowColor } from "./watermark-shadow";

/** Thông báo khi không tải được ảnh để xử lý (hook hiện lỗi đã dịch thay cho câu này). */
const IMAGE_LOAD_ERROR = "Không thể tải hình ảnh để xử lý";

/**
 * Tải ảnh cùng origin thành Blob rồi dựng thẻ ảnh: canvas không bị "tainted" nên xuất được ảnh đã sửa.
 * URL phải cùng origin (`attachmentService.contentStreamUrl`), không truyền URL R2 trực tiếp: khác origin, bucket
 * không có CORS thì `fetch` bị chặn.
 *
 * @param url - Đường dẫn cùng origin tới nội dung ảnh.
 * @returns Thẻ ảnh đã tải và hàm giải phóng Blob URL.
 * @throws Error khi tải hoặc giải mã ảnh thất bại.
 */
async function loadSafeImage(
  url: string,
): Promise<{ image: HTMLImageElement; cleanup: () => void }> {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(IMAGE_LOAD_ERROR);
  const blobUrl = URL.createObjectURL(await response.blob());
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(IMAGE_LOAD_ERROR));
      img.src = blobUrl;
    });
    return { image, cleanup: () => URL.revokeObjectURL(blobUrl) };
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}

/** Chất lượng nén cho định dạng có mất dữ liệu (JPEG/WebP): 0.95 gần như không thấy khác ảnh gốc. */
const LOSSY_QUALITY = 0.95;

/** Định dạng xuất theo định dạng gốc: không đổi PNG thành JPEG (nhòe chữ, mất nền trong suốt). */
type OutputFormat = { mimeType: string; extension: string; quality?: number };

/**
 * Chọn định dạng xuất giữ đúng chất lượng ảnh gốc: PNG/GIF/khác → PNG (không mất dữ liệu), WebP → WebP,
 * JPEG → JPEG chất lượng cao. Cắt tròn luôn PNG để giữ nền trong suốt.
 *
 * @param sourceType - MIME của ảnh gốc.
 * @param isRound - Có cắt tròn không.
 * @returns MIME, đuôi file và chất lượng nén (nếu có).
 */
function resolveOutputFormat(sourceType: string, isRound: boolean): OutputFormat {
  if (isRound) return { mimeType: "image/png", extension: "png" };
  if (sourceType === "image/jpeg")
    return { mimeType: "image/jpeg", extension: "jpg", quality: LOSSY_QUALITY };
  if (sourceType === "image/webp")
    return { mimeType: "image/webp", extension: "webp", quality: LOSSY_QUALITY };
  return { mimeType: "image/png", extension: "png" };
}

/**
 * Tính toán góc radian từ giá trị góc độ.
 *
 * @param degrees - Góc quay (độ).
 * @returns Góc quay tính bằng radian.
 */
function toRadian(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Tính toán kích thước hộp bao quanh (bounding box) của một hình chữ nhật sau khi quay.
 *
 * @param width - Chiều rộng ban đầu.
 * @param height - Chiều cao ban đầu.
 * @param rotation - Góc quay (độ).
 * @returns Kích thước chiều rộng và chiều cao mới.
 */
function calculateRotatedSize(width: number, height: number, rotation: number) {
  const rad = toRadian(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Cắt ảnh theo vùng pixel đã chọn, tùy chọn hình tròn và chèn chữ đóng dấu watermark lên canvas.
 *
 * @param options - Tùy chọn gồm URL ảnh, vùng crop pixel, cờ crop tròn, góc xoay và cấu hình watermark.
 * @param options.imageSrc - URL cùng origin tới nội dung ảnh gốc (`attachmentService.contentStreamUrl`).
 * @param options.sourceType - MIME của ảnh gốc (quyết định định dạng xuất, giữ chất lượng gốc).
 * @param options.pixelCrop - Vùng cắt theo pixel ảnh gốc; bỏ trống = giữ trọn ảnh (kiểu cắt "Ảnh gốc").
 * @param options.isRound - Có cắt thành hình tròn trong suốt xung quanh không.
 * @param options.rotation - Góc xoay ảnh (độ).
 * @param options.watermark - Cấu hình watermark văn bản (nếu có).
 * @returns Blob, URL đối tượng, MIME và đuôi file của ảnh đã xuất (giữ nguyên độ phân giải vùng cắt).
 */
export async function getCroppedImageCanvas({
  imageSrc,
  sourceType = "image/png",
  pixelCrop,
  isRound = false,
  rotation = 0,
  watermark,
}: {
  imageSrc: string;
  sourceType?: string;
  pixelCrop?: CropPixelArea;
  isRound?: boolean;
  rotation?: number;
  watermark?: WatermarkConfig;
}): Promise<{ blob: Blob; url: string; mimeType: string; extension: string }> {
  const { image, cleanup } = await loadSafeImage(imageSrc);

  try {
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;

    // Bước 1: Tạo canvas trung gian xoay ảnh nếu có góc quay
    const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedSize(
      naturalWidth,
      naturalHeight,
      rotation,
    );

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = Math.round(bBoxWidth);
    rotCanvas.height = Math.round(bBoxHeight);
    const rotCtx = rotCanvas.getContext("2d");

    if (!rotCtx) {
      throw new Error("Không thể khởi tạo ngữ cảnh vẽ xoay ảnh");
    }

    // Xoay quanh tâm canvas ĐÃ làm tròn: lệch nửa pixel là cả ảnh bị nội suy, nhòe.
    rotCtx.imageSmoothingEnabled = true;
    rotCtx.imageSmoothingQuality = "high";
    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate(toRadian(rotation));
    rotCtx.translate(-naturalWidth / 2, -naturalHeight / 2);
    rotCtx.drawImage(image, 0, 0);

    // Bước 2: Tạo canvas đích cắt đúng tọa độ pixelCrop từ canvas xoay
    // Làm tròn vùng cắt MỘT lần và dùng cùng số nguyên cho canvas lẫn drawImage: vẽ đúng 1:1, không co giãn
    // ngầm (co giãn = nội suy = ảnh mờ). Kích thước ảnh xuất bằng đúng vùng cắt trên ảnh gốc.
    const area = pixelCrop ?? { x: 0, y: 0, width: rotCanvas.width, height: rotCanvas.height };
    const cropX = Math.max(0, Math.round(area.x));
    const cropY = Math.max(0, Math.round(area.y));
    const cropWidth = Math.max(1, Math.min(Math.round(area.width), rotCanvas.width - cropX));
    const cropHeight = Math.max(1, Math.min(Math.round(area.height), rotCanvas.height - cropY));
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Không thể khởi tạo ngữ cảnh vẽ Canvas 2D");
    }

    ctx.save();

    // Nếu là crop tròn: vẽ đường cong clip hình elip/tròn
    if (isRound) {
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();
    }

    // Vẽ phần ảnh đã cắt từ rotCanvas sang canvas đích
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rotCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Nếu có bật đóng dấu watermark
    if (watermark && watermark.enabled && watermark.text.trim()) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, watermark.opacity / 100));

      // Tính kích thước chữ tương đối theo tỉ lệ ảnh
      const baseFontSize = Math.max(
        WATERMARK_MIN_OUTPUT_PX,
        Math.round((canvas.width * watermark.fontSize) / WATERMARK_FONT_SCALE),
      );
      ctx.font = `bold ${baseFontSize}px sans-serif`;

      const margin = Math.round(baseFontSize * 1.2);
      let x = canvas.width - margin;
      let y = canvas.height - margin;

      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";

      switch (watermark.position) {
        case "bottom-left":
          x = margin;
          y = canvas.height - margin;
          ctx.textAlign = "left";
          ctx.textBaseline = "bottom";
          break;
        case "top-left":
          x = margin;
          y = margin + baseFontSize;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          break;
        case "top-right":
          x = canvas.width - margin;
          y = margin + baseFontSize;
          ctx.textAlign = "right";
          ctx.textBaseline = "top";
          break;
        case "center":
          x = canvas.width / 2;
          y = canvas.height / 2;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          break;
        case "bottom-right":
        default:
          x = canvas.width - margin;
          y = canvas.height - margin;
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          break;
      }

      // Đổ bóng chữ để dễ nhìn trên mọi nền sáng/tối
      ctx.shadowColor = watermarkShadowColor(watermark.color);
      ctx.shadowBlur = Math.round(baseFontSize * 0.25);
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = watermark.color;
      ctx.fillText(watermark.text.trim(), x, y);

      ctx.restore();
    }

    ctx.restore();

    const format = resolveOutputFormat(sourceType, isRound);
    return await new Promise<{ blob: Blob; url: string; mimeType: string; extension: string }>(
      (resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Lỗi trích xuất Blob từ canvas"));
              return;
            }
            resolve({
              blob,
              url: URL.createObjectURL(blob),
              mimeType: format.mimeType,
              extension: format.extension,
            });
          },
          format.mimeType,
          format.quality,
        );
      },
    );
  } finally {
    cleanup();
  }
}
