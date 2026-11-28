"use client";

import { useTranslations } from "next-intl";

import { FormField } from "@/shares/components/common/form-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Switch } from "@/shares/components/ui/switch";

import type { LanguageItem } from "../../types/language.types";
import { useLanguageForm } from "./hooks/use-language-form";

/**
 * Form tạo mới / chi tiết / chỉnh sửa một ngôn ngữ hệ thống.
 *
 * @param props - Ngôn ngữ hiện có, cờ cho phép sửa và callback sau khi lưu.
 * @returns Biểu mẫu ngôn ngữ.
 */
export function LanguageForm({
  initial,
  canEdit = true,
  onSuccess,
}: {
  initial?: LanguageItem | null;
  canEdit?: boolean;
  onSuccess?: (saved: LanguageItem) => void;
}) {
  const t = useTranslations("system.languages");
  const tCommon = useTranslations("common");
  const readOnly = Boolean(initial) && !canEdit;
  const state = useLanguageForm({ initial, onSuccess });
  const { form } = state;

  return (
    <form onSubmit={state.submit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          label={t("fields.code")}
          required
          description={t("hints.code")}
        >
          {(field) => (
            <Input
              {...field}
              disabled={readOnly || Boolean(initial)}
              placeholder="ja"
              className="font-mono lowercase"
            />
          )}
        </FormField>

        <FormField control={form.control} name="name" label={t("fields.name")} required>
          {(field) => <Input {...field} disabled={readOnly} placeholder="日本語" />}
        </FormField>

        <FormField control={form.control} name="nativeName" label={t("fields.nativeName")}>
          {(field) => (
            <Input
              {...field}
              value={field.value ?? ""}
              disabled={readOnly}
              placeholder={t("placeholders.nativeName")}
            />
          )}
        </FormField>

        <FormField control={form.control} name="flagEmoji" label={t("fields.flagEmoji")}>
          {(field) => (
            <Input {...field} value={field.value ?? ""} disabled={readOnly} placeholder="🇯🇵" />
          )}
        </FormField>

        <FormField control={form.control} name="sortOrder" label={t("fields.sortOrder")}>
          {(field) => (
            <Input
              {...field}
              type="number"
              min={0}
              max={9999}
              disabled={readOnly}
              onChange={(e) => field.onChange(Number(e.target.value || 0))}
            />
          )}
        </FormField>

        <FormField control={form.control} name="isActive" label={t("fields.isActive")}>
          {(field) => (
            <div className="flex h-10 items-center">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={readOnly || Boolean(initial?.isDefault)}
              />
            </div>
          )}
        </FormField>
      </div>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={state.isPending}>
            {initial ? tCommon("actions.save") : tCommon("actions.create")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
