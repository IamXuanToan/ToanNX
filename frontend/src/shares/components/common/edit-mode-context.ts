import { createContext } from "react";

/** Trang chi tiết có cho chuyển sang chế độ sửa không (`null` = không phải trang chi tiết). */
export type EditModeContextValue = { canEdit: boolean };

/** Do `EditModeProvider` cấp; `FormPage` đọc để hiện nút "Sửa" trên header. */
export const EditModeContext = createContext<EditModeContextValue | null>(null);
