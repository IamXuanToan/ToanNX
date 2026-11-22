"use client";

import { useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { DateTimePicker } from "@/shares/components/common/date-time-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Textarea } from "@/shares/components/ui/textarea";

import { FINANCE_ROUTES } from "../constants/routes";
import type { Income } from "../types/income.types";
import { useIncomeForm } from "./hooks/use-income-form";
import { MoneyText } from "./money-text";
import { TaxStatusBadge } from "./tax-status-badge";

/**
 * Form giao dịch thu nhập (nhập tay, sửa, xem): cột chính thời điểm, nền tảng, số tiền + tỷ giá; cột phụ xem
 * trước VNĐ và khấu trừ theo mốc của nền tảng, cho phép nhập khấu trừ tay (theo chứng từ).
 *
 * @param props - Giao dịch (khi sửa), khóa sửa.
 * @returns Form.
 */
export function IncomeForm({ income, disabled = false }: { income?: Income; disabled?: boolean }) {
  const t = useTranslations("finance.incomes");
  const tCommon = useTranslations("common.actions");
  const state = useIncomeForm(income);
  const { form, preview } = state;
  const locked = disabled || state.isSubmitting;
  const isTaxManual = useWatch({ control: form.control, name: "isTaxManual" });
  const taxWithheld = useWatch({ control: form.control, name: "taxWithheld" });
  const rateSource = useWatch({ control: form.control, name: "rateSource" });
  const rootError = form.formState.errors.root?.message;
  const decimals = state.currency?.decimalPlaces ?? 0;
  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}
      <FormLayout
        aside={
          <>
            <FormSection title={t("sections.preview")}>
              <dl className="space-y-2 text-sm">
                {preview.isForeign ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("fields.exchangeRate")}</dt>
                    <dd className="text-end">
                      {preview.rateError ? (
                        <span className="text-destructive">{t("rateUnavailable")}</span>
                      ) : (
                        <>
                          <MoneyText value={preview.rate} />
                          {preview.rateDate ? (
                            <span className="text-muted-foreground block text-xs">
                              {t("rateDate", { date: preview.rateDate })}
                            </span>
                          ) : null}
                        </>
                      )}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("fields.amount")}</dt>
                  <dd className="font-medium">
                    <MoneyText value={preview.amount} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("fields.taxRate")}</dt>
                  <dd>{preview.taxRate ? `${preview.taxRate}%` : t("notWithheld")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("fields.taxAmount")}</dt>
                  <dd>
                    <MoneyText value={preview.tax} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("fields.grossAmount")}</dt>
                  <dd>
                    <MoneyText value={preview.gross} />
                  </dd>
                </div>
              </dl>
              {income ? <TaxStatusBadge status={income.taxStatus} rate={income.taxRate} /> : null}
              {!preview.hasTaxEntry && form.getValues("platformId") && !isTaxManual ? (
                <p className="text-warning text-sm">{t("noTaxEntry")}</p>
              ) : null}
            </FormSection>
            <FormSection title={t("sections.tax")}>
              <Controller
                control={form.control}
                name="isTaxManual"
                render={({ field }) => (
                  <ChoiceList
                    control="switch"
                    items={[
                      {
                        value: "manual",
                        label: t("fields.isTaxManual"),
                        description: t("fields.isTaxManualHint"),
                      },
                    ]}
                    value={field.value ? ["manual"] : []}
                    onToggle={(_, checked) => field.onChange(checked)}
                    disabled={locked}
                    aria-label={t("fields.isTaxManual")}
                  />
                )}
              />
              {isTaxManual ? (
                <>
                  <Controller
                    control={form.control}
                    name="taxWithheld"
                    render={({ field }) => (
                      <ChoiceList
                        control="switch"
                        items={[{ value: "withheld", label: t("fields.taxWithheld") }]}
                        value={field.value ? ["withheld"] : []}
                        onToggle={(_, checked) => field.onChange(checked)}
                        disabled={locked}
                        aria-label={t("fields.taxWithheld")}
                      />
                    )}
                  />
                  {taxWithheld ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="taxRate"
                        label={t("fields.taxRate")}
                        required
                      >
                        {(field) => (
                          <NumberInput
                            {...field}
                            min={0}
                            max={99.99}
                            onChange={(value) => field.onChange(String(value))}
                            disabled={locked}
                          />
                        )}
                      </FormField>
                      <FormField
                        control={form.control}
                        name="taxAmount"
                        label={t("fields.taxAmount")}
                        description={t("fields.taxAmountHint")}
                      >
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
                  ) : null}
                </>
              ) : null}
            </FormSection>
          </>
        }
      >
        <FormSection title={t("sections.info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="receivedAt"
              label={t("fields.receivedAt")}
              required
            >
              {(field) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked || preview.sepayLocked}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="platformId"
              label={t("fields.platform")}
              description={t("fields.platformHint")}
            >
              {(field) => (
                <SelectField
                  options={[{ value: "", label: t("autoDetect") }, ...state.platformOptions]}
                  value={field.value}
                  onValueChange={state.onPlatformChange}
                  disabled={locked}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="currencyId"
              label={t("fields.currency")}
              required
            >
              {(field) => (
                <SelectField
                  options={state.currencyOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="originalAmount"
              label={
                preview.sepayLocked ? t("fields.originalAmountBank") : t("fields.originalAmount")
              }
              required={!preview.sepayLocked}
            >
              {(field) => (
                <NumberInput
                  {...field}
                  min={0}
                  integer={decimals === 0}
                  onChange={(value) => field.onChange(String(value))}
                  disabled={locked}
                />
              )}
            </FormField>
          </div>
          {preview.isForeign && !preview.sepayLocked ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="rateSource"
                render={({ field }) => (
                  <RadioGroupField
                    legend={t("fields.rateSource")}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={locked}
                    options={[
                      { value: "API", label: t("rateSource.API") },
                      { value: "MANUAL", label: t("rateSource.MANUAL") },
                    ]}
                  />
                )}
              />
              {rateSource === "MANUAL" ? (
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  label={t("fields.exchangeRate")}
                  required
                >
                  {(field) => (
                    <NumberInput
                      {...field}
                      min={0}
                      onChange={(value) => field.onChange(String(value))}
                      disabled={locked}
                    />
                  )}
                </FormField>
              ) : null}
            </div>
          ) : null}
          <FormField control={form.control} name="content" label={t("fields.content")}>
            {(field) => <Textarea {...field} rows={2} disabled={locked} />}
          </FormField>
          <FormField
            control={form.control}
            name="note"
            label={t("fields.note")}
            description={t("fields.noteHint")}
          >
            {(field) => <Textarea {...field} rows={2} disabled={locked} />}
          </FormField>
          {income?.source === "SEPAY" ? (
            <p className="text-muted-foreground text-sm">
              {t("sepayInfo", {
                bank: income.bankName,
                last4: income.accountLast4,
                reference: income.referenceCode || "—",
              })}
            </p>
          ) : null}
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <Button type="button" variant="outline" asChild>
          <Link href={FINANCE_ROUTES.incomes}>
            {disabled ? tCommon("back") : tCommon("cancel")}
          </Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={state.isSubmitting}
            disabled={Boolean(income) && !form.formState.isDirty}
          >
            {income ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
