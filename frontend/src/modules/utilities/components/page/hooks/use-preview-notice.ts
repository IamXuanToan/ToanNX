"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Thuộc tính của hook `usePreviewNotice`.
 */
export interface UsePreviewNoticeProps {
  /** Trạng thái xuất bản của trang */
  status: string;
  /** Đường dẫn chỉnh sửa trang nếu có */
  editUrl?: string;
}

/**
 * Hook hiển thị thông báo toast khi người xem có quyền quản trị đang xem trang ở chế độ xem trước (bản nháp hoặc chưa công khai).
 *
 * @param props - Thuộc tính `UsePreviewNoticeProps`.
 */
export function usePreviewNotice({ status, editUrl }: UsePreviewNoticeProps) {
  const t = useTranslations("utilities.customPages.public");

  useEffect(() => {
    toast.info(t(status === "UNPUBLISHED" ? "previewUnpublished" : "previewDraft"), {
      description: t("previewHint"),
      duration: 10_000,
      action: editUrl
        ? { label: t("edit"), onClick: () => window.location.assign(editUrl) }
        : undefined,
    });
  }, [status, editUrl, t]);
}
