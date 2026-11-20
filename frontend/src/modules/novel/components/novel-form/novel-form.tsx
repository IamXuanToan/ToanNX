/**
 * Form nhập thông tin tiểu thuyết (`NovelForm`).
 *
 * Dùng cho cả tạo mới (`adminNovelsNew`) và chỉnh sửa (`adminNovelsEdit`).
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
import { MultiSelect } from "@/shares/components/common/multi-select/multi-select";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { SlugInput } from "@/shares/components/common/slug-input/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Switch } from "@/shares/components/ui/switch";
import { Textarea } from "@/shares/components/ui/textarea";

import { NOVEL_ROUTES } from "../../constants/routes";
import { useAuthorOptions } from "../../hooks/use-author-options";
import { useGenreOptions } from "../../hooks/use-genre-options";
import { useTagOptions } from "../../hooks/use-tag-options";
import type { Novel, NovelDetail } from "../../types/novel.types";
import { useNovelForm } from "./hooks/use-novel-form";

/**
 * Form thông tin tiểu thuyết.
 *
 * @param props - Tiểu thuyết hiện tại (nếu sửa), trạng thái disabled, callback lưu và hủy.
 * @returns Khối form hoàn chỉnh.
 */
export function NovelForm({
  novel,
  disabled = false,
  onSaved,
  onCancel,
}: {
  novel?: NovelDetail | Novel;
  disabled?: boolean;
  onSaved?: (novel: Novel) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("novel.novelForm");
  const tNovel = useTranslations("novel");
  const tActions = useTranslations("common.actions");

  const { form, onSubmit, isSubmitting } = useNovelForm({ novel, onSaved });
  const locked = disabled || isSubmitting;
  const rootError = form.formState.errors.root?.message;

  const { options: authorOptions } = useAuthorOptions();
  const { options: genreOptions } = useGenreOptions();
  const { options: tagOptions } = useTagOptions();

  const authorSelectOptions = [{ value: "", label: t("fields.noAuthor") }, ...authorOptions];

  const statusOptions = [
    { value: "ONGOING", label: tNovel("status.ONGOING") },
    { value: "COMPLETED", label: tNovel("status.COMPLETED") },
    { value: "PAUSED", label: tNovel("status.PAUSED") },
  ];

  return (
    <Form onSubmit={onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormLayout
        aside={
          <div className="space-y-6">
            <FormSection title={t("sections.thumbnail")}>
              <FormField control={form.control} name="thumbnail" label={t("fields.thumbnail")}>
                {(field) => (
                  <AttachmentImageUploadView
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={locked}
                  />
                )}
              </FormField>
            </FormSection>

            <FormSection title={t("sections.settings")}>
              <FormField control={form.control} name="status" label={t("fields.status")} required>
                {(field) => (
                  <SelectField
                    value={field.value}
                    onValueChange={field.onChange}
                    options={statusOptions}
                    disabled={locked}
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="isPublished"
                label={t("fields.isPublished")}
                description={t("fields.isPublishedHelp")}
              >
                {(field) => (
                  <div className="flex items-center gap-3 pt-1">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={locked}
                      id="isPublished-switch"
                    />
                    <label
                      htmlFor="isPublished-switch"
                      className="text-muted-foreground cursor-pointer text-sm select-none"
                    >
                      {field.value ? t("fields.published") : t("fields.draft")}
                    </label>
                  </div>
                )}
              </FormField>
            </FormSection>
          </div>
        }
      >
        <FormSection title={t("sections.general")}>
          <FormField control={form.control} name="title" label={t("fields.title")} required>
            {(field) => (
              <Input
                {...field}
                placeholder={t("fields.titlePlaceholder")}
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

          <FormField control={form.control} name="originalTitle" label={t("fields.originalTitle")}>
            {(field) => (
              <Input
                {...field}
                placeholder={t("fields.originalTitlePlaceholder")}
                disabled={locked}
              />
            )}
          </FormField>

          <FormField control={form.control} name="authorId" label={t("fields.author")}>
            {(field) => (
              <SelectField
                value={field.value ?? ""}
                onValueChange={(val) => field.onChange(val === "" ? null : val)}
                options={authorSelectOptions}
                placeholder={t("fields.authorPlaceholder")}
                disabled={locked}
                searchable
              />
            )}
          </FormField>

          <FormField control={form.control} name="genreIds" label={t("fields.genres")}>
            {(field) => (
              <MultiSelect
                value={field.value ?? []}
                onChange={field.onChange}
                options={genreOptions}
                placeholder={t("fields.genresPlaceholder")}
                disabled={locked}
              />
            )}
          </FormField>

          <FormField control={form.control} name="tagIds" label={t("fields.tags")}>
            {(field) => (
              <MultiSelect
                value={field.value ?? []}
                onChange={field.onChange}
                options={tagOptions}
                placeholder={t("fields.tagsPlaceholder")}
                disabled={locked}
              />
            )}
          </FormField>

          <FormField control={form.control} name="description" label={t("fields.description")}>
            {(field) => (
              <Textarea
                {...field}
                rows={6}
                placeholder={t("fields.descriptionPlaceholder")}
                disabled={locked}
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
              <Link href={NOVEL_ROUTES.adminNovels}>{tActions("cancel")}</Link>
            </Button>
          )}

          <FormSubmitButton isSubmitting={isSubmitting}>
            {novel ? tActions("save") : tActions("create")}
          </FormSubmitButton>
        </FormActions>
      </FormLayout>
    </Form>
  );
}
