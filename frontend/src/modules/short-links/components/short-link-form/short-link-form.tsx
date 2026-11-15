"use client";

import { useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list/choice-list";
import { DateTimePicker } from "@/shares/components/common/date-time-picker/date-time-picker";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { RadioGroupField } from "@/shares/components/common/radio-group-field/radio-group-field";
import { SlugInput } from "@/shares/components/common/slug-input/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { SHORT_LINKS_ROUTES } from "../../constants/routes";
import type { ShortLinkDetail } from "../../types/short-links.types";
import { useShortLinkForm } from "./hooks/use-short-link-form";

/**
 * Form link rút gọn **một form cho tạo, sửa, xem và dialog tạo/sửa nhanh**: cột chính Thông tin (tên, URL đích,
 * slug, mô tả), cột phụ Chuyển hướng (302/301 kèm cảnh báo, hết hạn) và Trạng thái.
 *
 * @param props - Link (khi sửa), khoá sửa, callback sau lưu và hủy (dialog).
 * @returns Form.
 */
export function ShortLinkForm({
  link,
  disabled = false,
  onSaved,
  onCancel,
}: {
  link?: ShortLinkDetail;
  disabled?: boolean;
  onSaved?: (link: ShortLinkDetail) => unknown;
  onCancel?: () => void;
}) {
  const t = useTranslations("shortLinks");
  const tCommon = useTranslations("common.actions");
  const tStatus = useTranslations("common.status");
  const { form, onSubmit, isSubmitting } = useShortLinkForm({ link, onSaved });
  const locked = disabled || isSubmitting;
  const redirectType = useWatch({ control: form.control, name: "redirectType" });
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
          <>
            <FormSection title={t("sections.redirect")}>
              <Controller
                control={form.control}
                name="redirectType"
                render={({ field }) => (
                  <RadioGroupField
                    legend={t("fields.redirectType")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={locked}
                    options={[
                      {
                        value: "302",
                        label: t("redirect.302"),
                        description: t("redirect.302Hint"),
                      },
                      {
                        value: "301",
                        label: t("redirect.301"),
                        description: t("redirect.301Hint"),
                      },
                    ]}
                  />
                )}
              />
              {redirectType === "301" ? (
                <p role="note" className="text-warning text-sm">
                  {t("redirect.301Warning")}
                </p>
              ) : null}
              <FormField control={form.control} name="expiresAt" label={t("fields.expiresAt")}>
                {(field) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    fromDate={new Date()}
                    disabled={locked}
                    invalid={field["aria-invalid"]}
                  />
                )}
              </FormField>
            </FormSection>
            <FormSection title={t("sections.status")}>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <ChoiceList
                    control="switch"
                    items={[
                      {
                        value: "isActive",
                        label: tStatus("active"),
                        description: t("fields.isActiveHint"),
                      },
                    ]}
                    value={field.value ? ["isActive"] : []}
                    onToggle={(_, checked) => field.onChange(checked)}
                    disabled={locked}
                    aria-label={t("sections.status")}
                  />
                )}
              />
            </FormSection>
          </>
        }
      >
        <FormSection title={t("sections.info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => <Input {...field} maxLength={150} disabled={locked} autoFocus={!link} />}
            </FormField>
            <FormField
              control={form.control}
              name="slug"
              label={t("fields.slug")}
              description={link ? t("fields.slugChangeHint") : t("fields.slugHint")}
            >
              {(field) => <SlugInput {...field} placeholder="github" disabled={locked} />}
            </FormField>
          </div>
          <FormField
            control={form.control}
            name="destinationUrl"
            label={t("fields.destinationUrl")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={2048}
                disabled={locked}
              />
            )}
          </FormField>
          <FormField control={form.control} name="description" label={t("fields.description")}>
            {(field) => <Textarea {...field} rows={3} maxLength={1000} disabled={locked} />}
          </FormField>
          {link ? (
            <p className="text-muted-foreground text-sm">
              {t("fields.shortUrl")}:{" "}
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {link.shortUrl}
              </a>
            </p>
          ) : null}
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild>
            <Link href={SHORT_LINKS_ROUTES.links}>
              {disabled ? tCommon("back") : tCommon("cancel")}
            </Link>
          </Button>
        )}
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={isSubmitting}
            disabled={Boolean(link) && !form.formState.isDirty}
          >
            {link ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
