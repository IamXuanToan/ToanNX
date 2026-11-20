/**
 * Form nhập thông tin thể loại (`GenreForm`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout";
import { SlugInput } from "@/shares/components/common/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { NOVEL_ROUTES } from "../constants/routes";
import type { Genre } from "../types/genre.types";
import { useGenreForm } from "./hooks/use-genre-form";

/**
 * Form thể loại tiểu thuyết.
 *
 * @param props - Thể loại hiện tại, trạng thái disabled, callback lưu thành công và hủy.
 * @returns Khối form hoàn chỉnh.
 */
export function GenreForm({
  genre,
  disabled = false,
  onSaved,
  onCancel,
}: {
  genre?: Genre;
  disabled?: boolean;
  onSaved?: (genre: Genre) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("novel.genres");
  const tActions = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useGenreForm({ genre, onSaved });
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

          <FormField control={form.control} name="description" label={t("fields.description")}>
            {(field) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={t("fields.descriptionPlaceholder")}
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
              <Link href={NOVEL_ROUTES.adminGenres}>{tActions("cancel")}</Link>
            </Button>
          )}
          <FormSubmitButton isSubmitting={isSubmitting} disabled={locked}>
            {genre ? tActions("save") : tActions("create")}
          </FormSubmitButton>
        </FormActions>
      </FormLayout>
    </Form>
  );
}
