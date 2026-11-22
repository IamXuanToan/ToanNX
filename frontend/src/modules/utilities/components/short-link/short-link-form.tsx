"use client";

import { useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { DateTimePicker } from "@/shares/components/common/date-time-picker";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout";
import { NumberInput } from "@/shares/components/common/number-input";
import { PasswordInput } from "@/shares/components/common/password-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SlugInput } from "@/shares/components/common/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { UTILITIES_ROUTES } from "../../constants/routes";
import type { ShortLinkDetail } from "../../types/short-link.types";
import { useShortLinkForm } from "./hooks/use-short-link-form";

/**
 * Form link rút gọn **một form cho tạo, sửa, xem và dialog tạo/sửa nhanh**: cột chính thông tin và trạng thái,
 * cột phụ cách mở, mật khẩu và hết hạn.
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
  const t = useTranslations("utilities.shortLinks");
  const tCommon = useTranslations("common.actions");
  const tStatus = useTranslations("common.status");
  const { form, onSubmit, isSubmitting } = useShortLinkForm({ link, onSaved });
  const locked = disabled || isSubmitting;
  const redirectMode = useWatch({ control: form.control, name: "redirectMode" });
  const hasExpiry = useWatch({ control: form.control, name: "hasExpiry" });
  const removePassword = useWatch({ control: form.control, name: "removePassword" });
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
                name="redirectMode"
                render={({ field }) => (
                  <RadioGroupField
                    legend={t("fields.redirectMode")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={locked}
                    options={[
                      {
                        value: "manual",
                        label: t("redirect.manual"),
                        description: t("redirect.manualHint"),
                      },
                      {
                        value: "timed",
                        label: t("redirect.timed"),
                        description: t("redirect.timedHint"),
                      },
                    ]}
                  />
                )}
              />
              {redirectMode === "timed" ? (
                <FormField
                  control={form.control}
                  name="autoRedirectSeconds"
                  label={t("fields.autoRedirectSeconds")}
                  required
                >
                  {(field) => (
                    <NumberInput
                      {...field}
                      integer
                      min={1}
                      max={60}
                      onChange={(value) => field.onChange(String(value))}
                      disabled={locked}
                    />
                  )}
                </FormField>
              ) : null}
            </FormSection>
            <FormSection title={t("sections.access")}>
              <Controller
                control={form.control}
                name="hasExpiry"
                render={({ field }) => (
                  <ChoiceList
                    control="switch"
                    items={[{ value: "hasExpiry", label: t("fields.hasExpiry") }]}
                    value={field.value ? ["hasExpiry"] : []}
                    onToggle={(_, checked) => field.onChange(checked)}
                    disabled={locked}
                    aria-label={t("fields.hasExpiry")}
                  />
                )}
              />
              {hasExpiry ? (
                <FormField
                  control={form.control}
                  name="expiresAt"
                  label={t("fields.expiresAt")}
                  required
                >
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
              ) : null}
              <FormField
                control={form.control}
                name="password"
                label={t("fields.password")}
                description={
                  link?.hasPassword ? t("fields.passwordKeepHint") : t("fields.passwordHint")
                }
              >
                {(field) => (
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    maxLength={128}
                    disabled={locked || removePassword}
                  />
                )}
              </FormField>
              {link?.hasPassword ? (
                <Controller
                  control={form.control}
                  name="removePassword"
                  render={({ field }) => (
                    <ChoiceList
                      control="switch"
                      items={[{ value: "removePassword", label: t("fields.removePassword") }]}
                      value={field.value ? ["removePassword"] : []}
                      onToggle={(_, checked) => field.onChange(checked)}
                      disabled={locked}
                      aria-label={t("fields.removePassword")}
                    />
                  )}
                />
              ) : null}
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
              {(field) => (
                <div className="flex min-w-0 gap-2">
                  <SlugInput {...field} preserveCase className="min-w-0 flex-1" disabled={locked} />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={locked}
                    onClick={() =>
                      form.setValue("slug", crypto.randomUUID(), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {t("actions.generateSlug")}
                  </Button>
                </div>
              )}
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
          <div className="border-t pt-5">
            <p className="mb-3 text-sm font-medium">{t("sections.status")}</p>
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
          </div>
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild>
            <Link href={UTILITIES_ROUTES.shortLinks}>
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
