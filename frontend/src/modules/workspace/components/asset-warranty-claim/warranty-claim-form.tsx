"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

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
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";

import { CLAIM_STATUSES, CLAIM_TYPES } from "../../constants/defaults";
import type { AssetWarrantyClaim } from "../../types/asset-warranty-claim.types";
import { AssetInvoicesField } from "../asset/asset-invoices-field";
import { useWarrantyClaimForm } from "./hooks/use-warranty-claim-form";

/**
 * Form Tạo / Sửa Phiếu bảo hành / sửa chữa thiết bị kèm chứng từ riêng tư và chi phí.
 *
 * @param props - Bản ghi phiếu bảo hành (khi sửa) và trạng thái chỉ xem/khóa.
 * @returns Form hoàn chỉnh gắn `FormActions`.
 */
export function WarrantyClaimForm({
  claim,
  disabled = false,
}: {
  claim?: AssetWarrantyClaim;
  disabled?: boolean;
}) {
  const t = useTranslations("workspace.warrantyClaims");
  const tCommon = useTranslations("common.actions");
  const state = useWarrantyClaimForm(claim);
  const { form } = state;
  const locked = disabled || state.isSubmitting;
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
          <FormSection title={t("attachmentsSection")}>
            <AssetInvoicesField
              files={state.files}
              onAdd={state.addFiles}
              onRemove={state.removeFile}
              disabled={locked}
              error={form.formState.errors.attachmentIds?.message}
            />
          </FormSection>
        }
      >
        <FormSection title={t("editTitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField control={form.control} name="assetId" label={t("fields.assetId")} required>
                {(field) => (
                  <SelectField
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={locked}
                    options={state.assetOptions}
                  />
                )}
              </FormField>
            </div>
            <FormField control={form.control} name="claimType" label={t("fields.claimType")}>
              {(field) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  options={CLAIM_TYPES.map((type) => ({
                    value: type,
                    label: t(`types.${type}`),
                  }))}
                />
              )}
            </FormField>
            <FormField control={form.control} name="status" label={t("fields.status")}>
              {(field) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  options={CLAIM_STATUSES.map((s) => ({ value: s, label: t(`statuses.${s}`) }))}
                />
              )}
            </FormField>
            <FormField control={form.control} name="claimCode" label={t("fields.claimCode")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <FormField
              control={form.control}
              name="submittedDate"
              label={t("fields.submittedDate")}
              required
            >
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="estimatedReturnDate"
              label={t("fields.estimatedReturnDate")}
            >
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  clearable
                />
              )}
            </FormField>
            <FormField control={form.control} name="returnedDate" label={t("fields.returnedDate")}>
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  clearable
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="serviceCenter"
              label={t("fields.serviceCenter")}
              required
            >
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <FormField
              control={form.control}
              name="serviceCenterContact"
              label={t("fields.serviceCenterContact")}
            >
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="serviceCenterAddress"
                label={t("fields.serviceCenterAddress")}
              >
                {(field) => <Input {...field} disabled={locked} className="h-10" />}
              </FormField>
            </div>
            <FormField
              control={form.control}
              name="externalTicketCode"
              label={t("fields.externalTicketCode")}
            >
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <div className="flex items-center gap-2 pt-6">
              <Controller
                control={form.control}
                name="isCoveredByWarranty"
                render={({ field }) => (
                  <Checkbox
                    id="isCoveredByWarranty"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    disabled={locked}
                  />
                )}
              />
              <Label htmlFor="isCoveredByWarranty">{t("fields.isCoveredByWarranty")}</Label>
            </div>
            <FormField control={form.control} name="cost" label={t("fields.cost")}>
              {(field) => (
                <NumberInput
                  {...field}
                  onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                  disabled={locked}
                  className="h-10"
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="currencyId"
              label={t("fields.currencyId")}
              required
            >
              {(field) => (
                <SelectField
                  id={field.id}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
                  options={state.currencyOptions}
                />
              )}
            </FormField>
            {state.isForeign ? (
              <FormField
                control={form.control}
                name="exchangeRate"
                label={t("fields.exchangeRate")}
              >
                {(field) => (
                  <NumberInput
                    {...field}
                    onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                    disabled={locked}
                    className="h-10"
                  />
                )}
              </FormField>
            ) : null}
            <FormField
              control={form.control}
              name="partWarrantyMonths"
              label={t("fields.partWarrantyMonths")}
            >
              {(field) => (
                <NumberInput
                  {...field}
                  integer
                  onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                  disabled={locked}
                  className="h-10"
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="partWarrantyEndDate"
              label={t("fields.partWarrantyEndDate")}
            >
              {(field) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  clearable
                />
              )}
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="issueDescription"
                label={t("fields.issueDescription")}
                required
              >
                {(field) => <Textarea {...field} disabled={locked} rows={3} />}
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="resolutionNotes"
                label={t("fields.resolutionNotes")}
              >
                {(field) => <Textarea {...field} disabled={locked} rows={2} />}
              </FormField>
            </div>
          </div>
        </FormSection>
      </FormLayout>

      <FormActions>
        <Button asChild type="button" variant="outline">
          <Link href={state.cancelHref as never}>
            {disabled ? tCommon("back") : tCommon("cancel")}
          </Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
