"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import { useEditModeButton } from "./hooks/use-edit-mode-button";

/**
 * Nút "Sửa" ở header `FormPage` khi trang chi tiết đang chỉ xem (không hiện ở trang tạo hay khi thiếu quyền).
 *
 * @returns Nút, hoặc null.
 */
export function EditModeButton() {
  const t = useTranslations("common.table");
  const { visible, enterEditMode } = useEditModeButton();
  if (!visible) return null;
  return (
    <Button type="button" className="h-10 rounded-xl" onClick={enterEditMode}>
      <Pencil aria-hidden />
      {t("edit")}
    </Button>
  );
}
