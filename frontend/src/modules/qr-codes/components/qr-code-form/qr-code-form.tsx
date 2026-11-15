"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ColorInput } from "@/shares/components/common/color-input/color-input";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { MoneyInput } from "@/shares/components/common/money-input/money-input";
import { NumberInput } from "@/shares/components/common/number-input/number-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Textarea } from "@/shares/components/ui/textarea";

import { QR_CODES_ROUTES } from "../../constants/routes";
import { ERROR_CORRECTION_LEVELS, QR_TYPES, type QrCodeDetail } from "../../types/qr-codes.types";
import { useQrCodeForm } from "./hooks/use-qr-code-form";

/**
 * Form mã QR **một form cho tạo, sửa, xem**: cột chính là loại + nội dung theo loại; cột phụ là xem trước trực
 * tiếp, kiểu dáng và nút tải PNG/SVG. Sửa nội dung/kiểu dáng thì ảnh trong Thư viện được vẽ lại (giữ id) nên
 * trang nào đã chèn ảnh này tự hiện mã mới.
 *
 * @param props - Mã QR (khi sửa) và khoá sửa.
 * @returns Form.
 */
export function QrCodeForm({
  code,
  disabled = false,
}: {
  code?: QrCodeDetail;
  disabled?: boolean;
}) {
  const t = useTranslations("qrCodes");
  const tCommon = useTranslations("common.actions");
  const state = useQrCodeForm({ code });
  const { form, preview, qrType } = state;
  const locked = disabled || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const svg = preview.data?.svg;

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
              <div className="bg-muted/40 flex aspect-square items-center justify-center rounded-xl border p-4">
                {svg ? (
                  // SVG do BE vẽ, hiển thị bằng <img> (không chèn SVG thô vào DOM).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={svg} alt={t("previewAlt")} className="max-h-full max-w-full" />
                ) : preview.isFetching ? (
                  <Skeleton className="size-full rounded-lg" />
                ) : (
                  <p className="text-muted-foreground text-center text-sm">{t("previewEmpty")}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {code ? (
                  <Button asChild variant="outline">
                    <a
                      href={code.image.url}
                      download={`${code.name}.png`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download />
                      PNG
                    </a>
                  </Button>
                ) : null}
                {svg ? (
                  <Button asChild variant="outline">
                    <a href={svg} download={`${form.getValues("name") || "qr-code"}.svg`}>
                      <Download />
                      SVG
                    </a>
                  </Button>
                ) : null}
              </div>
            </FormSection>
            <FormSection title={t("sections.design")}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="size" label={t("fields.size")}>
                  {(field) => (
                    <NumberInput
                      {...field}
                      value={field.value}
                      onChange={(value) => field.onChange(value === "" ? 512 : value)}
                      min={128}
                      max={1024}
                      step={64}
                      integer
                      disabled={locked}
                    />
                  )}
                </FormField>
                <FormField control={form.control} name="margin" label={t("fields.margin")}>
                  {(field) => (
                    <NumberInput
                      {...field}
                      value={field.value}
                      onChange={(value) => field.onChange(value === "" ? 0 : value)}
                      min={0}
                      max={8}
                      integer
                      disabled={locked}
                    />
                  )}
                </FormField>
              </div>
              <FormField control={form.control} name="foreground" label={t("fields.foreground")}>
                {(field) => (
                  <ColorInput
                    value={field.value}
                    onChange={field.onChange}
                    pickerLabel={t("fields.foreground")}
                    disabled={locked}
                    invalid={field["aria-invalid"]}
                  />
                )}
              </FormField>
              <FormField control={form.control} name="background" label={t("fields.background")}>
                {(field) => (
                  <ColorInput
                    value={field.value}
                    onChange={field.onChange}
                    pickerLabel={t("fields.background")}
                    disabled={locked}
                    invalid={field["aria-invalid"]}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="errorCorrection"
                label={t("fields.errorCorrection")}
              >
                {(field) => (
                  <SelectField
                    id={field.id}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={locked}
                    options={ERROR_CORRECTION_LEVELS.map((level) => ({
                      value: level,
                      label: t(`errorCorrection.${level}`),
                    }))}
                  />
                )}
              </FormField>
            </FormSection>
          </>
        }
      >
        <FormSection title={t("sections.content")}>
          <FormField control={form.control} name="name" label={t("fields.name")} required>
            {(field) => <Input {...field} maxLength={150} disabled={locked} autoFocus={!code} />}
          </FormField>
          <Controller
            control={form.control}
            name="qrType"
            render={({ field }) => (
              <RadioGroupField
                legend={t("fields.qrType")}
                value={field.value}
                onChange={field.onChange}
                disabled={locked}
                options={QR_TYPES.map((value) => ({
                  value,
                  label: t(`types.${value}`),
                  description: t(`types.${value}Hint`),
                }))}
              />
            )}
          />
          {qrType === "BANK_TRANSFER" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="bankBin" label={t("fields.bank")} required>
                {(field) => (
                  <SelectField
                    id={field.id}
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    searchable
                    disabled={locked || state.banks.isPending}
                    invalid={field["aria-invalid"]}
                    options={(state.banks.data ?? []).map((bank) => ({
                      value: bank.bin,
                      label: bank.shortName,
                      description: bank.name,
                    }))}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="accountNumber"
                label={t("fields.accountNumber")}
                required
              >
                {(field) => (
                  <Input {...field} inputMode="numeric" maxLength={19} disabled={locked} />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="accountName"
                label={t("fields.accountName")}
                description={t("fields.accountNameHint")}
                required
              >
                {(field) => <Input {...field} maxLength={50} disabled={locked} />}
              </FormField>
              <FormField control={form.control} name="amount" label={t("fields.amount")}>
                {(field) => (
                  <MoneyInput
                    value={field.value}
                    onChange={field.onChange}
                    currency="VND"
                    disabled={locked}
                    aria-invalid={field["aria-invalid"]}
                  />
                )}
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="message"
                  label={t("fields.message")}
                  description={t("fields.messageHint")}
                >
                  {(field) => <Input {...field} maxLength={25} disabled={locked} />}
                </FormField>
              </div>
            </div>
          ) : qrType === "URL" ? (
            <FormField
              control={form.control}
              name="url"
              label={t("fields.url")}
              description={t("fields.urlHint")}
              required
            >
              {(field) => (
                <Input
                  {...field}
                  type="url"
                  placeholder="https://"
                  maxLength={2048}
                  disabled={locked}
                />
              )}
            </FormField>
          ) : (
            <FormField control={form.control} name="text" label={t("fields.text")} required>
              {(field) => <Textarea {...field} rows={4} maxLength={1000} disabled={locked} />}
            </FormField>
          )}
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <Button type="button" variant="outline" asChild>
          <Link href={QR_CODES_ROUTES.codes}>{disabled ? tCommon("back") : tCommon("cancel")}</Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={state.isSubmitting}
            disabled={Boolean(code) && !form.formState.isDirty}
          >
            {code ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
