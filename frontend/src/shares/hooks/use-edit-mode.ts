"use client";

import { useSearchParams } from "next/navigation";

import { EDIT_MODE_PARAM, EDIT_MODE_VALUE } from "@/shares/lib/edit-mode";

/**
 * Trang chi tiết đang ở chế độ sửa: có quyền sửa **và** URL có `?mode=edit` (bấm "Sửa" ở bảng hoặc header).
 * Mặc định trang chi tiết chỉ xem; thiếu quyền thì `?mode=edit` cũng không mở được.
 *
 * @param canUpdate - Người dùng có quyền sửa tài nguyên.
 * @returns Có cho sửa form hay không.
 */
export function useEditMode(canUpdate: boolean): boolean {
  const searchParams = useSearchParams();
  return canUpdate && searchParams.get(EDIT_MODE_PARAM) === EDIT_MODE_VALUE;
}
