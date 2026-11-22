"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import { SYSTEM_ROUTES } from "../../../constants/routes";

import { useSetAttachmentVisibility } from "../../../hooks/use-set-attachment-visibility";
import { useUpdateAttachment } from "../../../hooks/use-update-attachment";
import type { Attachment, AttachmentVisibility } from "../../../types/attachment.types";

/**
 * Thuộc tính đầu vào của hook `useAttachmentDetailDialog`.
 */
export interface UseAttachmentDetailDialogProps {
  /** Tệp ban đầu cần xem hoặc sửa thông tin */
  file: Attachment;
  /** Callback được gọi khi tệp được cập nhật thành công */
  onUpdated?: (updated: Attachment) => void;
}

/**
 * Hook điều khiển toàn bộ logic hiển thị, sao chép URL/tên và chỉnh sửa inline tên/alt text của tệp trong dialog chi tiết.
 *
 * @param props - Thuộc tính `UseAttachmentDetailDialogProps`.
 * @returns State của tệp, trạng thái inline edit, trạng thái clipboard và các hàm xử lý sự kiện tương ứng.
 */
export function useAttachmentDetailDialog({ file, onUpdated }: UseAttachmentDetailDialogProps) {
  const t = useTranslations("system.attachment");
  const updateMutation = useUpdateAttachment();
  const visibilityMutation = useSetAttachmentVisibility();
  const [pendingVisibility, setPendingVisibility] = useState<AttachmentVisibility | null>(null);

  const [currentFile, setCurrentFile] = useState<Attachment>(file);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageEditing, setIsImageEditing] = useState(false);
  const [editName, setEditName] = useState(file.originalName);
  const [editAlt, setEditAlt] = useState(file.altText || "");
  const [nameError, setNameError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const locale = useLocale() as AppLocale;
  // File riêng tư chia sẻ bằng trang kiểm quyền `/tep/{id}` (báo "không có quyền" thay vì lỗi API thô).
  const shareUrl =
    currentFile.visibility === "private" && typeof window !== "undefined"
      ? `${window.location.origin}${getPathname({ href: SYSTEM_ROUTES.fileAccess(currentFile.id), locale })}`
      : currentFile.url;

  const handleCopyUrl = () => {
    void navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyName = () => {
    void navigator.clipboard.writeText(currentFile.originalName);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const handleStartEdit = () => {
    setEditName(currentFile.originalName);
    setEditAlt(currentFile.altText || "");
    setNameError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(currentFile.originalName);
    setEditAlt(currentFile.altText || "");
    setNameError("");
    setIsEditing(false);
  };

  const handleSaveEdit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setNameError(t("fileNameRequired"));
      return;
    }
    if (trimmedName.length > 255) {
      setNameError(t("fileNameMax"));
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({
        id: currentFile.id,
        originalName: trimmedName,
        altText: editAlt.trim(),
      });
      setCurrentFile(updated);
      onUpdated?.(updated);
      setIsEditing(false);
    } catch {
      // Lỗi được xử lý qua toast của useUpdateAttachment
    }
  };

  const confirmVisibility = async () => {
    if (!pendingVisibility || visibilityMutation.isPending) return;
    try {
      const updated = await visibilityMutation.mutateAsync({
        id: currentFile.id,
        visibility: pendingVisibility,
      });
      setCurrentFile(updated);
      onUpdated?.(updated);
      setPendingVisibility(null);
    } catch {
      // Lỗi được báo qua toast của useSetAttachmentVisibility
    }
  };

  return {
    currentFile,
    setCurrentFile,
    shareUrl,
    isEditing,
    isImageEditing,
    setIsImageEditing,
    editName,
    setEditName,
    editAlt,
    setEditAlt,
    nameError,
    setNameError,
    copiedUrl,
    copiedName,
    isSaving: updateMutation.isPending,
    handleCopyUrl,
    handleCopyName,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    pendingVisibility,
    setPendingVisibility,
    confirmVisibility,
    isChangingVisibility: visibilityMutation.isPending,
  };
}
