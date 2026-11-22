"use client";

import type { ReactNode } from "react";

import { EditModeContext } from "./edit-mode-context";

/**
 * Bọc trang chi tiết (trong View): báo `FormPage` bên trong hiện nút "Sửa" khi đang chỉ xem mà có quyền sửa.
 *
 * @param props - Có quyền sửa và nội dung trang.
 * @returns Provider.
 */
export function EditModeProvider({ canEdit, children }: { canEdit: boolean; children: ReactNode }) {
  return <EditModeContext.Provider value={{ canEdit }}>{children}</EditModeContext.Provider>;
}
