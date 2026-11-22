"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext } from "react";

import { EDIT_MODE_PARAM, EDIT_MODE_VALUE } from "@/shares/lib/edit-mode";

import { EditModeContext } from "../edit-mode-context";

/**
 * Nút "Sửa" trên header trang chi tiết: hiện khi trang có `EditModeProvider` cho phép sửa và đang chỉ xem;
 * bấm thì thêm `?mode=edit` (giữ nguyên các tham số khác).
 *
 * @returns Có hiện nút và hàm chuyển sang chế độ sửa.
 */
export function useEditModeButton() {
  const context = useContext(EditModeContext);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get(EDIT_MODE_PARAM) === EDIT_MODE_VALUE;
  const enterEditMode = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(EDIT_MODE_PARAM, EDIT_MODE_VALUE);
    router.replace(`${pathname}?${params.toString()}`);
  };
  return { visible: Boolean(context?.canEdit) && !isEditing, enterEditMode };
}
