"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { SwitchField } from "@/shares/components/common/switch-field";

import type { AttachmentVisibility } from "../../types/attachment.types";

/**
 * Công tắc chế độ xem cho tệp sắp tải lên.
 *
 * @param props - Giá trị hiện tại, callback, khóa lựa chọn (nơi dùng bắt buộc một chế độ) và trạng thái bận.
 * @returns Công tắc "Riêng tư" hoặc dòng thông báo khi nơi dùng khóa chế độ riêng tư.
 */
export function AttachmentVisibilityToggle({
  value,
  onChange,
  locked = false,
  disabled = false,
}: {
  value: AttachmentVisibility;
  onChange: (value: AttachmentVisibility) => void;
  locked?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("system.attachment");
  if (locked) {
    return value === "private" ? (
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        {t("privateLocked")}
      </p>
    ) : null;
  }
  return (
    <SwitchField
      label={t("privateToggle")}
      description={t("privateToggleHint")}
      checked={value === "private"}
      onCheckedChange={(checked) => onChange(checked ? "private" : "public")}
      disabled={disabled}
    />
  );
}
