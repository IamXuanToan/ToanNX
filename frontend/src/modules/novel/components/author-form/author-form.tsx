/**
 * Form nhập thông tin tác giả (`AuthorForm`).
 *
 * Dùng được cả ở trang riêng (`FormPage`) và dialog tạo/sửa nhanh (`FormDialog`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AttachmentImageUploadView } from "@/modules/attachment/views/attachment-image-upload-view";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { SlugInput } from "@/shares/components/common/slug-input/slug-input";
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={locked}>
              {tActions("cancel")}
            </Button>
          ) : (
            <Button asChild variant="outline" disabled={locked}>
              <Link href={NOVEL_ROUTES.adminAuthors}>{tActions("cancel")}</Link>
            </Button>
          )}
          <FormSubmitButton isSubmitting={isSubmitting} disabled={locked}>
            {author ? tActions("save") : tActions("create")}
          </FormSubmitButton>
        </FormActions>
      </FormLayout>
    </Form>
  );
}
