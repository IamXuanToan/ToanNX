/**
 * Form nhập thông tin thẻ (`TagForm`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout";
import { SlugInput } from "@/shares/components/common/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { Tag } from "../../types/tag.types";
import { useTagForm } from "./hooks/use-tag-form";

/**
 * Form thẻ phân loại truyện.
 *
 * @param props - Thẻ hiện tại, trạng thái disabled, callback lưu thành công và hủy.
 * @returns Khối form hoàn chỉnh.
 */
export function TagForm({
  tag,
  disabled = false,
  onSaved,
  onCancel,
}: {
  tag?: Tag;
  disabled?: boolean;
  onSaved?: (tag: Tag) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("novel.tags");
  const tActions = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useTagForm({ tag, onSaved });
  const locked = disabled || isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Form onSubmit={onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormLayout>
        <FormSection title={t("sections.general")}>
          <FormField control={form.control} name="name" label={t("fields.name")} required>
            {(field) => (
              <Input
                {...field}
                placeholder={t("fields.namePlaceholder")}
                disabled={locked}
                autoFocus
              />
            )}
          </FormField>

          <FormField control={form.control} name="slug" label={t("fields.slug")}>
            {(field) => (
              <SlugInput
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder={t("fields.slugPlaceholder")}
                disabled={locked}
              />
            )}
          </FormField>
        </FormSection>

        <FormActions>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {tActions("cancel")}
            </Button>
          ) : (
            <FormBackButton href={NOVEL_ROUTES.adminTags} />
          )}
          {disabled ? null : (
            <FormSubmitButton isSubmitting={isSubmitting}>
              {tag ? tActions("save") : tActions("create")}
            </FormSubmitButton>
          )}
        </FormActions>
      </FormLayout>
    </Form>
  );
}
