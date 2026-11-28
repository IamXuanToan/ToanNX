"use client";

import { useTranslations } from "next-intl";

import { DatePicker } from "@/shares/components/common/date-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormField } from "@/shares/components/common/form-field";
import { FormLayout } from "@/shares/components/common/form-layout";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import {
  ASSET_CATEGORIES,
  ASSET_PURCHASE_CHANNELS,
  ASSET_STATUSES,
  ASSET_WARRANTY_TYPES,
} from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Asset } from "../../types/asset.types";
import { AssetInvoicesField } from "./asset-invoices-field";
import { useAssetForm } from "./hooks/use-asset-form";

/**
 * Form Tạo / Chi tiết Thiết bị cá nhân: định danh, giá mua + quy đổi tiền tệ, bảo hành và chứng từ riêng tư.
 *
 * @param props - Bản ghi thiết bị (khi sửa) và trạng thái chỉ xem/khóa.
 * @returns Form hoàn chỉnh gắn `FormActions`.
 */
export function AssetForm({ asset, disabled = false }: { asset?: Asset; disabled?: boolean }) {
  const t = useTranslations("workspace.assets");
  const tCommon = useTranslations("common.actions");
  const state = useAssetForm(asset);
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
          <FormSection title={t("invoicesSection")}>
            <AssetInvoicesField
              files={state.files}
              onAdd={state.addFiles}
              onRemove={state.removeFile}
              disabled={locked}
              error={form.formState.errors.invoiceAttachmentIds?.message}
            />
          </FormSection>
        }
      >
        <FormSection title={t("sections.identity")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField control={form.control} name="name" label={t("fields.name")} required>
                {(field) => <Input {...field} disabled={locked} className="h-10" />}
              </FormField>
            </div>
            <FormField control={form.control} name="brand" label={t("fields.brand")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <FormField control={form.control} name="modelCode" label={t("fields.modelCode")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <FormField control={form.control} name="category" label={t("fields.category")}>
              {(field) => (
                <SelectField
                  id={field.id}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  searchable
                  invalid={field["aria-invalid"]}
                  options={ASSET_CATEGORIES.map((c) => ({
                    value: c,
                    label: t(`categories.${c}`),
                  }))}
                />
              )}
            </FormField>
            <FormField control={form.control} name="status" label={t("fields.status")}>
              {(field) => (
                <SelectField
                  id={field.id}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
                  options={ASSET_STATUSES.map((s) => ({ value: s, label: t(`statuses.${s}`) }))}
                />
              )}
            </FormField>
            <FormField control={form.control} name="serialNumber" label={t("fields.serialNumber")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <FormField control={form.control} name="imei" label={t("fields.imei")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
          </div>
        </FormSection>

        <FormSection title={t("sections.purchase")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="purchaseDate"
              label={t("fields.purchaseDate")}
              required
            >
              {(field) => (
                <DatePicker
                  id={field.id}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={locked}
                  invalid={field["aria-invalid"]}
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
                  searchable
                  invalid={field["aria-invalid"]}
                  options={state.currencyOptions}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="purchasePrice"
              label={t("fields.purchasePrice")}
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
              name="purchaseStore"
              label={t("fields.purchaseStore")}
            >
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <FormField
              control={form.control}
              name="purchaseChannel"
              label={t("fields.purchaseChannel")}
            >
              {(field) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  options={ASSET_PURCHASE_CHANNELS.map((ch) => ({
                    value: ch,
                    label: t(`channels.${ch}`),
                  }))}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="purchaseOrderCode"
              label={t("fields.purchaseOrderCode")}
            >
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="purchaseOrderUrl"
                label={t("fields.purchaseOrderUrl")}
              >
                {(field) => <Input {...field} disabled={locked} className="h-10" />}
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="purchaseBranchAddress"
                label={t("fields.purchaseBranchAddress")}
              >
                {(field) => <Input {...field} disabled={locked} className="h-10" />}
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="storeWarrantyContact"
                label={t("fields.storeWarrantyContact")}
              >
                {(field) => <Input {...field} disabled={locked} className="h-10" />}
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection title={t("sections.warranty")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="warrantyType" label={t("fields.warrantyType")}>
              {(field) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={locked}
                  options={ASSET_WARRANTY_TYPES.map((w) => ({
                    value: w,
                    label: t(`warrantyTypes.${w}`),
                  }))}
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="warrantyMonths"
              label={t("fields.warrantyMonths")}
            >
              {(field) => (
                <NumberInput
                  integer
                  value={field.value}
                  onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                  disabled={locked}
                  className="h-10"
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="warrantyStartDate"
              label={t("fields.warrantyStartDate")}
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
            <FormField
              control={form.control}
              name="warrantyEndDate"
              label={t("fields.warrantyEndDate")}
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
                name="warrantyProvider"
                label={t("fields.warrantyProvider")}
              >
                {(field) => <Input {...field} disabled={locked} className="h-10" />}
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="warrantyNote"
                label={t("fields.warrantyNote")}
              >
                {(field) => <Textarea {...field} disabled={locked} rows={2} />}
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField control={form.control} name="notes" label={t("fields.notes")}>
                {(field) => <Textarea {...field} disabled={locked} rows={3} />}
              </FormField>
            </div>
          </div>
        </FormSection>
      </FormLayout>

      <FormActions>
        <FormBackButton href={WORKSPACE_ROUTES.assets} />
        {disabled ? null : (
          <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
