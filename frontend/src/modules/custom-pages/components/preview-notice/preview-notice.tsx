"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Toast cho người có quyền đang xem bản chưa công khai (BE trả `preview: true`).
 *
 * @param props - Trạng thái trang và đường dẫn sửa (nếu người xem có quyền sửa — page quyết định).
 * @returns Không render gì (chỉ toast).
 */
export function PreviewNotice({ status, editUrl }: { status: string; editUrl?: string }) {
  const t = useTranslations("customPages.public");
  useEffect(() => {
    toast.info(t(status === "UNPUBLISHED" ? "previewUnpublished" : "previewDraft"), {
      description: t("previewHint"),
      duration: 10_000,
      action: editUrl
        ? { label: t("edit"), onClick: () => window.location.assign(editUrl) }
        : undefined,
    });
  }, [status, editUrl, t]);
  return null;
}
