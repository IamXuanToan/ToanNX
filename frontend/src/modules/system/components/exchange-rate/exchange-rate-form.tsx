"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DatePicker } from "@/shares/components/common/date-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useExchangeRateForm } from "./hooks/use-exchange-rate-form";

/** @returns Form nhập tay tỷ giá (ví dụ tỷ giá trung tâm NHNN hoặc ngân hàng khác). */
export function ExchangeRateForm() {
  const t = useTranslations("system.exchangeRates");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting, currencyOptions } = useExchangeRateForm();
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
            <FormField
              control={form.control}
              name="currencyId"
              label={t("fields.currency")}
              required
            >
              {(field) => (
                <SelectField
                  options={currencyOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField control={form.control} name="rateDate" label={t("fields.rateDate")} required>
              {(field) => <DatePicker value={field.value} onChange={field.onChange} />}
            </FormField>
            <FormField control={form.control} name="rate" label={t("fields.rate")} required>
              {(field) => (
                <NumberInput
                  {...field}
                  min={0}
                  onChange={(value) => field.onChange(String(value))}
                />
              )}
            </FormField>
          </div>
          <FormField
            control={form.control}
            name="note"
            label={t("fields.note")}
            description={t("fields.noteHint")}
          >
            {(field) => <Input {...field} maxLength={500} />}
          </FormField>
        </FormSection>
      </FormLayout>
      <FormActions>
        <Button type="button" variant="outline" asChild>
          <Link href={SYSTEM_ROUTES.exchangeRates}>{tCommon("cancel")}</Link>
        </Button>
        <FormSubmitButton isSubmitting={isSubmitting}>{tCommon("create")}</FormSubmitButton>
      </FormActions>
    </Form>
  );
}
