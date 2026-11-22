"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { SelectField } from "@/shares/components/common/select-field";
import { SlugInput } from "@/shares/components/common/slug-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { FINANCE_ROUTES } from "../constants/routes";
import type { Platform } from "../types/platform.types";
import { usePlatformForm } from "./hooks/use-platform-form";

/**
 * Form nền tảng (một form cho tạo, sửa, xem). Lịch sử khấu trừ nằm ở section riêng trên trang chi tiết.
 *
 * @param props - Nền tảng (khi sửa), khóa sửa.
 * @returns Form.
 */
export function PlatformForm({
  platform,
  disabled = false,
}: {
  platform?: Platform;
  disabled?: boolean;
}) {
  const t = useTranslations("finance.platforms");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting, currencyOptions } = usePlatformForm(platform);
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
        <FormSection title={t("sections.info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => (
                <Input {...field} maxLength={150} disabled={locked} autoFocus={!platform} />
              )}
            </FormField>
            <FormField control={form.control} name="code" label={t("fields.code")} required>
              {(field) => <SlugInput {...field} disabled={locked} />}
            </FormField>
            <FormField
              control={form.control}
              name="defaultCurrencyId"
              label={t("fields.defaultCurrency")}
              description={t("fields.defaultCurrencyHint")}
              required
            >
              {(field) => (
                <SelectField
                  options={currencyOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
          </div>
          <FormField control={form.control} name="note" label={t("fields.note")}>
            {(field) => <Textarea {...field} rows={3} disabled={locked} />}
          </FormField>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <ChoiceList
                control="switch"
                items={[{ value: "isActive", label: t("fields.isActive") }]}
                value={field.value ? ["isActive"] : []}
                onToggle={(_, checked) => field.onChange(checked)}
                disabled={locked}
                aria-label={t("fields.isActive")}
              />
            )}
          />
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <Button type="button" variant="outline" asChild>
          <Link href={FINANCE_ROUTES.platforms}>
            {disabled ? tCommon("back") : tCommon("cancel")}
          </Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={isSubmitting}
            disabled={Boolean(platform) && !form.formState.isDirty}
          >
            {platform ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
