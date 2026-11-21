"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";

import type { SystemSetting } from "../types/setting.types";
import { SettingEditForm } from "./setting-edit-form";

interface SettingEditDialogProps {
  setting: SystemSetting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog chỉnh sửa giá trị cấu hình hệ thống.
 *
 * @param props - Cấu hình setting đang chọn và callback đóng/mở.
 * @returns Dialog chỉnh sửa giá trị cấu hình.
 */
export function SettingEditDialog({ setting, open, onOpenChange }: SettingEditDialogProps) {
  const t = useTranslations("system.settings.table");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editValueTitle")}</DialogTitle>
          <DialogDescription>{t("editValueDesc", { key: setting?.key ?? "" })}</DialogDescription>
        </DialogHeader>

        {setting ? (
          <SettingEditForm
            key={setting.id}
            setting={setting}
            onCancel={() => onOpenChange(false)}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
