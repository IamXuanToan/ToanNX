"use client";

import { useState } from "react";

import type { PagePath } from "../../types/page-path.types";

/**
 * Hook quản lý trạng thái chọn đường dẫn giữa và dialog tạo/sửa nhanh đường dẫn:
 * - Trạng thái dialog ('create' | 'edit' | null).
 * - Tìm kiếm đường dẫn đang chọn trong danh sách paths.
 * - Các hàm mở dialog tạo, sửa và đóng dialog.
 *
 * @param paths - Danh sách các đường dẫn giữa hiện có.
 * @param value - Id của đường dẫn đang được chọn.
 * @returns Trạng thái dialog, đường dẫn đang chọn và các hàm điều khiển dialog.
 */
export function usePagePathSelect(paths: PagePath[], value: string) {
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const selected = paths.find((path) => path.id === value);

  return {
    dialog,
    setDialog,
    selected,
    openCreate: () => setDialog("create"),
    openEdit: () => setDialog("edit"),
    closeDialog: () => setDialog(null),
  };
}
