"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import type { Attachment } from "../../types/attachment.types";

/**
 * Hook quản lý trạng thái sao chép và đóng mở hộp thoại chỉnh sửa của tệp trong AttachmentDetails.
 *
 * @param file - Đối tượng tệp đang xem chi tiết.
 * @returns Các hàm và trạng thái sao chép URL, sao chép tên gốc, và đóng mở dialog chỉnh sửa.
 */
export function useAttachmentDetails(file: Attachment) {
  const t = useTranslations("attachment");
  const [copiedName, setCopiedName] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const copyName = () => {
    void navigator.clipboard.writeText(file.originalName);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  return {
    copy,
    copyName,
    copiedName,
    editOpen,
    setEditOpen,
  };
}
