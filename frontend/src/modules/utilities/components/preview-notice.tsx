"use client";

import { usePreviewNotice } from "./hooks/use-preview-notice";

/**
 * Toast cho người có quyền đang xem bản chưa công khai (BE trả `preview: true`).
 *
 * @param props - Trạng thái trang và đường dẫn sửa (nếu người xem có quyền sửa — page quyết định).
 * @returns Không render gì (chỉ toast).
 */
export function PreviewNotice({ status, editUrl }: { status: string; editUrl?: string }) {
  usePreviewNotice({ status, editUrl });
  return null;
}
