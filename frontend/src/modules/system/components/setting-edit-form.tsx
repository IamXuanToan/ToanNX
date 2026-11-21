"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shares/components/ui/button";
import { DialogFooter } from "@/shares/components/ui/dialog";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";

import { useUpdateSetting } from "../hooks/use-update-setting";
import type { SystemSetting } from "../types/setting.types";

interface SettingEditFormProps {
  setting: SystemSetting;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Form chỉnh sửa giá trị JSON của cấu hình hệ thống.
 *
 * @param props - Cấu hình hệ thống và callback đóng/thành công.
 * @returns Form chỉnh sửa giá trị.
 */
export function SettingEditForm({ setting, onCancel, onSuccess }: SettingEditFormProps) {
  const t = useTranslations("system.settings.table");
  const updateSetting = useUpdateSetting(setting.id);

  const [valueText, setValueText] = useState(() => JSON.stringify(setting.value, null, 2));
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(valueText);
    } catch {
      setErrorText(t("jsonInvalid"));
      return;
    }

    try {
      await updateSetting.mutateAsync({ value: parsedValue });
      toast.success(t("saveValue"));
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorText(msg);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-4 py-4">
        {setting.description ? (
          <p className="text-muted-foreground text-xs leading-relaxed">{setting.description}</p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="setting-json-value">{t("valueLabel")}</Label>
          <Textarea
            id="setting-json-value"
            value={valueText}
            onChange={(e) => {
              setValueText(e.target.value);
              setErrorText(null);
            }}
            rows={8}
            className="font-mono text-xs"
            placeholder='true / "value" / 100 / {"key": "val"}'
          />
          {errorText ? <p className="text-destructive text-xs font-medium">{errorText}</p> : null}
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={updateSetting.isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={updateSetting.isPending}>
          {updateSetting.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {t("saveValue")}
        </Button>
      </DialogFooter>
    </form>
  );
}
