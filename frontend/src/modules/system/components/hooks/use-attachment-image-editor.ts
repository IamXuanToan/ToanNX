"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import {
  CROP_ASPECT_RATIOS,
  ORIGINAL_CROP_ID,
  WATERMARK_COLOR_DEFAULT,
  WATERMARK_FONT_DEFAULT,
} from "../../constants/image-editor";
import { useUploadAttachment } from "../../hooks/use-upload-attachment";
import { getCroppedImageCanvas } from "../../lib/crop-image-canvas";
import { attachmentService } from "../../services/attachment.service";
import type { Attachment } from "../../types/attachment.types";
import type { CropPixelArea, WatermarkConfig } from "../../types/image-editor.types";

/** Thuộc tính đầu vào của hook `useAttachmentImageEditor`. */
export type UseAttachmentImageEditorProps = {
  /** Tệp ảnh cần chỉnh sửa. */
  file: Attachment;
  /** Callback khi lưu tệp ảnh mới thành công. */
  onSaved: (newAttachment: Attachment) => void;
  /** Callback khi hủy chỉnh sửa ảnh. */
  onCancel: () => void;
};

/**
 * Hook điều khiển toàn bộ logic crop ảnh (vuông, tròn, tự do), xoay và đóng dấu watermark.
 *
 * @param props - Thuộc tính `UseAttachmentImageEditorProps`.
 * @returns State và các hàm điều khiển công cụ chỉnh sửa ảnh.
 */
export function useAttachmentImageEditor({
  file,
  onSaved,
  onCancel,
}: UseAttachmentImageEditorProps) {
  const t = useTranslations("system.attachment");
  const apiErrorMessage = useApiErrorMessage();
  const uploadMutation = useUploadAttachment();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [selectedRatioId, setSelectedRatioId] = useState<string>(ORIGINAL_CROP_ID);
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [cropShape, setCropShape] = useState<"rect" | "round">("rect");
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | undefined>(
    undefined,
  );
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropPixelArea | null>(null);

  const [watermark, setWatermark] = useState<WatermarkConfig>({
    enabled: false,
    text: "",
    position: "bottom-right",
    opacity: 85,
    fontSize: WATERMARK_FONT_DEFAULT,
    color: WATERMARK_COLOR_DEFAULT,
  });

  const [activeTab, setActiveTab] = useState<"crop" | "watermark">("crop");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // "Ảnh gốc": khung phủ trọn ảnh theo tỉ lệ ảnh (đổi chiều khi xoay 90°), không kéo/thu phóng được.
  const isOriginal = selectedRatioId === ORIGINAL_CROP_ID;
  const isQuarterTurn = rotation % 180 !== 0;
  const originalAspect = mediaSize
    ? isQuarterTurn
      ? mediaSize.height / mediaSize.width
      : mediaSize.width / mediaSize.height
    : undefined;

  const onCropComplete = (
    _croppedArea: { x: number; y: number; width: number; height: number },
    pixelCrop: CropPixelArea,
  ) => {
    setCroppedAreaPixels(pixelCrop);
  };

  const handleRatioChange = (ratioId: string) => {
    const target = CROP_ASPECT_RATIOS.find((r) => r.id === ratioId);
    if (!target) return;

    setSelectedRatioId(target.id);
    if (target.id === ORIGINAL_CROP_ID) {
      setAspect(undefined);
      setCropShape("rect");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } else if (target.id === "free") {
      setAspect(undefined);
      setCropShape("rect");
    } else {
      setCropSize(undefined);
      setAspect(target.aspect);
      setCropShape(target.isRound ? "round" : "rect");
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = async () => {
    if (!isOriginal && !croppedAreaPixels) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      const { blob, mimeType, extension } = await getCroppedImageCanvas({
        // Đọc bytes cùng origin qua backend: URL R2 khác origin bị CORS chặn khi fetch/vẽ canvas.
        imageSrc: attachmentService.contentStreamUrl(file.id),
        // Giữ định dạng gốc (PNG không bị nén thành JPEG).
        sourceType: file.contentType,
        // "Ảnh gốc" không cắt: xuất trọn ảnh (chỉ xoay/watermark).
        pixelCrop: isOriginal ? undefined : (croppedAreaPixels ?? undefined),
        isRound: cropShape === "round",
        rotation,
        watermark,
      });

      const baseName = file.originalName.replace(/\.[^/.]+$/, "");
      const createdFile = new File([blob], `${baseName}_edited.${extension}`, { type: mimeType });

      const uploaded = await uploadMutation.mutateAsync({
        file: createdFile,
        folderId: file.folderId,
        visibility: file.visibility,
      });

      onSaved(uploaded);
    } catch (error) {
      // Lỗi API (upload) dịch theo mã; lỗi tải/vẽ ảnh phía trình duyệt dùng câu chung đã dịch.
      setErrorMessage(isApiError(error) ? apiErrorMessage(error) : t("imageEditFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isOriginal,
    /** Tỉ lệ khung cắt thực tế: "Ảnh gốc" theo tỉ lệ ảnh, kiểu khác theo lựa chọn. */
    cropperAspect: isOriginal ? originalAspect : aspect,
    onMediaLoaded: (size: { naturalWidth: number; naturalHeight: number }) =>
      setMediaSize({ width: size.naturalWidth, height: size.naturalHeight }),
    /** "Ảnh gốc" khóa vị trí và thu phóng (khung luôn phủ trọn ảnh). */
    onCropChange: (next: { x: number; y: number }) => {
      if (!isOriginal) setCrop(next);
    },
    onZoomChange: (next: number) => {
      if (!isOriginal) setZoom(next);
    },
    crop,
    setCrop,
    zoom,
    setZoom,
    rotation,
    selectedRatioId,
    aspect,
    cropShape,
    cropSize,
    setCropSize,
    watermark,
    setWatermark,
    activeTab,
    setActiveTab,
    isSaving,
    errorMessage,
    onCropComplete,
    handleRatioChange,
    handleRotate,
    handleSave,
    handleCancel: onCancel,
  };
}
