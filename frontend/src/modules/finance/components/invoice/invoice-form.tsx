"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { ChoiceList } from "@/shares/components/common/choice-list";
import { DatePicker } from "@/shares/components/common/date-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";

import { DOC_TYPES } from "../../constants/finance-enums";
import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import type { Invoice } from "../../types/invoice.types";
import { useInvoiceForm } from "./hooks/use-invoice-form";
import { InvoiceAttachmentsField } from "./invoice-attachments-field";
import { MoneyText } from "../income/money-text";

/**
 * Form hóa đơn / chứng từ: thông tin, số tiền (quy VNĐ theo ngày lập), file riêng tư bắt buộc, giao dịch gắn
 * và đối chiếu (chỉ hiển thị, không kết luận đúng/sai).
 *
 * @param props - Hóa đơn (khi sửa), khóa sửa.
 * @returns Form.
 */
export function InvoiceForm({
  invoice,
  disabled = false,
}: {
  invoice?: Invoice;
  disabled?: boolean;
}) {
  const t = useTranslations("finance.invoices");
  const tCommon = useTranslations("common.actions");
  const routes = useFinanceRoutes();
  const format = useFormatter();
  const state = useInvoiceForm(invoice);
  const { form } = state;
  const locked = disabled || state.isSubmitting;
  const rateSource = useWatch({ control: form.control, name: "rateSource" });
  const rootError = form.formState.errors.root?.message;
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
            <FormSection title={t("sections.files")}>
              <InvoiceAttachmentsField
                files={state.files}
                onAdd={state.addFiles}
                onRemove={state.removeFile}
                disabled={locked}
                error={form.formState.errors.attachmentIds?.message}
              />
            </FormSection>
            {invoice ? (
              <FormSection title={t("sections.reconciliation")}>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("reconciliation.incomeCount")}</dt>
                    <dd>{invoice.reconciliation.incomeCount}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("reconciliation.gross")}</dt>
                    <dd>
                      <MoneyText value={invoice.reconciliation.incomeGrossAmount} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("reconciliation.tax")}</dt>
                    <dd>
                      <MoneyText value={invoice.reconciliation.incomeTaxAmount} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-1">
                    <dt className="text-muted-foreground">{t("reconciliation.grossDifference")}</dt>
                    <dd>
                      <MoneyText value={invoice.reconciliation.grossDifference} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("reconciliation.taxDifference")}</dt>
                    <dd>
                      <MoneyText value={invoice.reconciliation.taxDifference} />
                    </dd>
                  </div>
                </dl>
              </FormSection>
            ) : null}
          </>
        }
      >
        <FormSection title={t("sections.info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="docType" label={t("fields.docType")} required>
              {(field) => (
                <SelectField
                  options={DOC_TYPES.map((type) => ({ value: type, label: t(`docType.${type}`) }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                />
              )}
            </FormField>
            <FormField control={form.control} name="number" label={t("fields.number")}>
              {(field) => <Input {...field} maxLength={100} disabled={locked} />}
            </FormField>
            <FormField control={form.control} name="issuer" label={t("fields.issuer")} required>
              {(field) => <Input {...field} maxLength={255} disabled={locked} />}
            </FormField>
            <FormField
              control={form.control}
              name="issuerTaxCode"
              label={t("fields.issuerTaxCode")}
            >
              {(field) => <Input {...field} maxLength={50} disabled={locked} />}
            </FormField>
            <FormField control={form.control} name="issuedOn" label={t("fields.issuedOn")} required>
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField control={form.control} name="platformId" label={t("fields.platform")}>
              {(field) => (
                <SelectField
                  options={[{ value: "", label: "—" }, ...state.platformOptions]}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                />
              )}
            </FormField>
            <FormField control={form.control} name="periodFrom" label={t("fields.periodFrom")}>
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  clearable
                />
              )}
            </FormField>
            <FormField control={form.control} name="periodTo" label={t("fields.periodTo")}>
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  clearable
                />
              )}
            </FormField>
          </div>
        </FormSection>
        <FormSection title={t("sections.amount")}>
          <div className="grid gap-5 sm:grid-cols-3">
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
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="originalAmount"
              label={t("fields.originalAmount")}
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
            <FormField
              control={form.control}
              name="originalTaxAmount"
              label={t("fields.originalTaxAmount")}
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
          </div>
          {state.isForeign ? (
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
          {invoice ? (
            <p className="text-muted-foreground text-sm">
              {t("vndSummary", {
                amount: format.number(Number(invoice.amount)),
                tax: format.number(Number(invoice.taxAmount ?? 0)),
              })}
            </p>
          ) : null}
        </FormSection>
        <FormSection title={t("sections.incomes")}>
          <Controller
            control={form.control}
            name="incomeIds"
            render={({ field }) => (
              <ChoiceList
                control="checkbox"
                items={state.incomes.map((income) => ({
                  value: income.id,
                  label: `${income.receivedDate} · ${income.platformName ?? "?"}`,
                  description: `${format.number(Number(income.amount ?? 0))} ${CURRENCY_SYMBOLS.VND} · ${income.content}`,
                }))}
                value={field.value}
                onToggle={(value, checked) =>
                  field.onChange(
                    checked
                      ? [...field.value, value]
                      : field.value.filter((item) => item !== value),
                  )
                }
                disabled={locked}
                aria-label={t("sections.incomes")}
              />
            )}
          />
          {!state.incomes.length ? (
            <p className="text-muted-foreground text-sm">{t("noIncomes")}</p>
          ) : null}
        </FormSection>
        <FormSection title={t("fields.note")}>
          <FormField control={form.control} name="note" label={t("fields.note")}>
            {(field) => <Textarea {...field} rows={3} disabled={locked} />}
          </FormField>
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <FormBackButton href={routes.invoices} />
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={state.isSubmitting}
            disabled={Boolean(invoice) && !form.formState.isDirty}
          >
            {invoice ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
