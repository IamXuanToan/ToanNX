"use client";

import { useStoredPreference } from "@/shares/hooks/use-stored-preference";

export type AttachmentViewMode = "grid" | "compact" | "list";

const VIEW_MODE_KEY = "attachment_view_mode";

function isAttachmentViewMode(value: unknown): value is AttachmentViewMode {
  return value === "grid" || value === "compact" || value === "list";
}

/**
 * Hook quản lý chế độ hiển thị tệp đính kèm (Lưới lớn, Lưới nhỏ, Danh sách chi tiết).
 * Tự động đồng bộ và lưu lựa chọn vào localStorage để duy trì trạng thái khi người dùng chuyển trang hoặc mở lại.
 * Tái sử dụng `useStoredPreference` an toàn SSR, đồng bộ giữa các tabs.
 *
 * @returns Chế độ hiển thị hiện tại và hàm cập nhật.
 */
export function useAttachmentViewMode() {
  const [viewMode, setViewMode] = useStoredPreference<AttachmentViewMode>(
    VIEW_MODE_KEY,
    "grid",
    isAttachmentViewMode,
  );

  return { viewMode, setViewMode };
}
