/**
 * Form nhập thông tin tác giả (`AuthorForm`).
 *
 * Dùng được cả ở trang riêng (`FormPage`) và dialog tạo/sửa nhanh (`FormDialog`).
 */

"use client";

import { useTranslations } from "next-intl";

import { AttachmentImageUploadView } from "@/modules/system/views/attachment/attachment-image-upload-view";
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
import { Textarea } from "@/shares/components/ui/textarea";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { Author } from "../../types/author.types";
import { useAuthorForm } from "./hooks/use-author-form";

/**
 * Form tác giả tiểu thuyết.
 *
 * @param props - Tác giả hiện tại, trạng thái disabled, callback lưu thành công và hủy.
 * @returns Khối form hoàn chỉnh.
 */
export function AuthorForm({
  author,
  disabled = false,
  onSaved,
  onCancel,
}: {
  author?: Author;
  disabled?: boolean;
  onSaved?: (author: Author) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("novel.authors");
  const tActions = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useAuthorForm({ author, onSaved });
  const locked = disabled || isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Form onSubmit={onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormLayout
        aside={
          <FormSection title={t("sections.avatar")}>
            <FormField control={form.control} name="avatar" label={t("fields.avatar")}>
              {(field) => (
                <AttachmentImageUploadView
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={locked}
                />
              )}
            </FormField>
          </FormSection>
        }
      >
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

          <FormField control={form.control} name="bio" label={t("fields.bio")}>
            {(field) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={t("fields.bioPlaceholder")}
                disabled={locked}
                rows={4}
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
            <FormBackButton href={NOVEL_ROUTES.adminAuthors} />
          )}
          {disabled ? null : (
            <FormSubmitButton isSubmitting={isSubmitting}>
              {author ? tActions("save") : tActions("create")}
            </FormSubmitButton>
          )}
        </FormActions>
      </FormLayout>
    </Form>
  );
}
