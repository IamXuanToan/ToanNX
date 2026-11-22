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
import { NumberInput } from "@/shares/components/common/number-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { SYSTEM_ROUTES } from "../constants/routes";
import type { Currency } from "../types/currency.types";
import { useCurrencyForm } from "./hooks/use-currency-form";

/** @param props - Tiền tệ (khi sửa), khóa sửa. @returns Form tiền tệ (tiền tệ gốc khóa mã/trạng thái). */
export function CurrencyForm({
  currency,
  disabled = false,
}: {
  currency?: Currency;
  disabled?: boolean;
}) {
  const t = useTranslations("system.currencies");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useCurrencyForm(currency);
  const locked = disabled || isSubmitting;
  const baseLocked = locked || Boolean(currency?.isBase);
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
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField control={form.control} name="code" label={t("fields.code")} required>
              {(field) => (
                <Input
                  {...field}
                  maxLength={3}
                  disabled={baseLocked}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                />
              )}
            </FormField>
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => <Input {...field} maxLength={100} disabled={locked} />}
            </FormField>
            <FormField control={form.control} name="symbol" label={t("fields.symbol")} required>
              {(field) => <Input {...field} maxLength={10} disabled={locked} />}
            </FormField>
            <FormField
              control={form.control}
              name="decimalPlaces"
              label={t("fields.decimalPlaces")}
              required
            >
              {(field) => (
                <NumberInput
                  {...field}
                  integer
                  min={0}
                  max={4}
                  onChange={(value) => field.onChange(String(value))}
                  disabled={baseLocked}
                />
              )}
            </FormField>
            <FormField control={form.control} name="position" label={t("fields.position")} required>
              {(field) => (
                <NumberInput
                  {...field}
                  integer
                  min={0}
                  onChange={(value) => field.onChange(String(value))}
                  disabled={locked}
                />
              )}
            </FormField>
          </div>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <ChoiceList
                control="switch"
                items={[{ value: "isActive", label: t("fields.isActive") }]}
                value={field.value ? ["isActive"] : []}
                onToggle={(_, checked) => field.onChange(checked)}
                disabled={baseLocked}
                aria-label={t("fields.isActive")}
              />
            )}
          />
        </FormSection>
      </FormLayout>
      <FormActions>
        <Button type="button" variant="outline" asChild>
          <Link href={SYSTEM_ROUTES.currencies}>
            {disabled ? tCommon("back") : tCommon("cancel")}
          </Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={isSubmitting}
            disabled={Boolean(currency) && !form.formState.isDirty}
          >
            {currency ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
