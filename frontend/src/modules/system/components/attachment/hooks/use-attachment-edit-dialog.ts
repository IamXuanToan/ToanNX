"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useUpdateAttachment } from "../../../hooks/use-update-attachment";
import type { Attachment } from "../../../types/attachment.types";

/**
 * State và hành động cho dialog chỉnh sửa thông tin tệp (tên tệp và alt text).
 *
 * @param file - Tệp đang chỉnh sửa.
 * @param onClose - Callback đóng dialog.
 * @param onSuccess - Callback sau khi cập nhật thành công.
 * @returns State form, cờ xử lý và handler lưu.
 */
export function useAttachmentEditDialog(
  file: Attachment,
  onClose: () => void,
  onSuccess?: (updated: Attachment) => void,
) {
  const t = useTranslations("system.attachment");
  const errorMessage = useApiErrorMessage();
  const mutation = useUpdateAttachment();

  const [originalName, setOriginalName] = useState(file.originalName);
  const [altText, setAltText] = useState(file.altText ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;

    const trimmedName = originalName.trim();
    if (!trimmedName) {
      setNameError(t("fileNameRequired"));
      return;
    }
    if (trimmedName.length > 255) {
      setNameError(t("fileNameMax"));
      return;
    }

    setNameError(null);
    try {
      const updated = await mutation.mutateAsync({
        id: file.id,
        originalName: trimmedName,
        altText: altText.trim(),
      });
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return {
    originalName,
    setOriginalName: (value: string) => {
      setOriginalName(value);
      if (nameError) setNameError(null);
    },
    altText,
    setAltText,
    nameError,
    busy: mutation.isPending,
    handleSubmit,
  };
}
