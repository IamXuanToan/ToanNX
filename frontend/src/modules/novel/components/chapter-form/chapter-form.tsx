/**
 * Form nhập nội dung chương truyện (`ChapterForm`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { NumberInput } from "@/shares/components/common/number-input/number-input";
import { SlugInput } from "@/shares/components/common/slug-input/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { ChapterDetail, ChapterListItem } from "../../types/chapter.types";
import { useChapterForm } from "./hooks/use-chapter-form";

/**
 * Form chương truyện.
 *
 * @param props - Chi tiết chương, novelId, trạng thái disabled, callback lưu và hủy.
 * @returns Khối form hoàn chỉnh.
 */
export function ChapterForm({
  chapter,
  novelId,
  disabled = false,
  onSaved,
  onCancel,
}: {
  chapter?: ChapterDetail | ChapterListItem;
  novelId?: string;
  disabled?: boolean;
  onSaved?: (chapter: ChapterDetail | ChapterListItem) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("novel.chapters");
  const tActions = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useChapterForm({ chapter, novelId, onSaved });
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <FormField control={form.control} name="chapterNumber" label={t("fields.chapterNumber")} required>
                {(field) => (
                  <NumberInput
                    value={field.value}
                    onChange={(val) => field.onChange(typeof val === "number" ? val : 1)}
                    disabled={locked}
                    min={1}
                    integer
                  />
                )}
              </FormField>
            </div>
            <div className="sm:col-span-3">
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
            </div>
          </div>

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

          <FormField control={form.control} name="content" label={t("fields.content")} required>
            {(field) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={t("fields.contentPlaceholder")}
                disabled={locked}
                rows={14}
                className="font-mono text-sm leading-relaxed"
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
              <Link href={NOVEL_ROUTES.adminChapters}>{tActions("cancel")}</Link>
            </Button>
          )}
          <FormSubmitButton isSubmitting={isSubmitting} disabled={locked}>
            {chapter ? tActions("save") : tActions("create")}
          </FormSubmitButton>
        </FormActions>
      </FormLayout>
    </Form>
  );
}
