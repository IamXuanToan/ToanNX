"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { PasswordInput } from "@/shares/components/common/password-input";
import { SelectField } from "@/shares/components/common/select-field";
import { TagsInput } from "@/shares/components/common/tags-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { VAULT_CATEGORIES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { VaultItem } from "../../types/vault-item.types";
import { useVaultItemForm } from "./hooks/use-vault-item-form";

/**
 * Form Tạo / Sửa mục Két sắt bí mật (mã hóa AES-256 trên máy chủ).
 * Khi chỉnh sửa, bỏ trống ô bí mật để giữ nguyên giá trị đang lưu.
 *
 * @param props - Mục Két sắt (khi sửa) và trạng thái chỉ xem/khóa.
 * @returns Form mục Két sắt.
 */
export function VaultItemForm({
  item,
  disabled = false,
}: {
  item?: VaultItem;
  disabled?: boolean;
}) {
  const t = useTranslations("workspace.vault");
  const tCommon = useTranslations("common.actions");
  const state = useVaultItemForm(item);
  const { form } = state;
  const locked = disabled || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormSection title={t("editTitle")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="title" label={t("fields.title")} required>
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
          <FormField control={form.control} name="category" label={t("fields.category")}>
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                options={VAULT_CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`categories.${c}`),
                }))}
              />
            )}
          </FormField>
          <FormField control={form.control} name="username" label={t("fields.username")}>
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
          <FormField
            control={form.control}
            name="secret"
            label={t("fields.secret")}
            required={state.isCreate}
            description={!state.isCreate ? t("secretKeepHint") : undefined}
          >
            {(field) => (
              <PasswordInput
                {...field}
                disabled={locked}
                autoComplete="new-password"
                placeholder={item?.secretLast4 ? `••••${item.secretLast4}` : undefined}
                className="h-10"
              />
            )}
          </FormField>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="url" label={t("fields.url")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="tags" label={t("fields.tags")}>
              {(field) => (
                <TagsInput value={field.value} onChange={field.onChange} disabled={locked} />
              )}
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="notes" label={t("fields.notes")}>
              {(field) => <Textarea {...field} disabled={locked} rows={3} />}
            </FormField>
          </div>
        </div>
      </FormSection>

      {disabled ? null : (
        <FormActions>
          <Button asChild type="button" variant="outline">
            <Link href={WORKSPACE_ROUTES.vault}>{tCommon("cancel")}</Link>
          </Button>
          <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
        </FormActions>
      )}
    </Form>
  );
}
