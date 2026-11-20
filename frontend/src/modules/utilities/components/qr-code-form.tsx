"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { AttachmentImageUploadView } from "@/modules/system/views/attachment-image-upload-view";
import { ColorInput } from "@/shares/components/common/color-input";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout";
import { MoneyInput } from "@/shares/components/common/money-input";
import { NumberInput } from "@/shares/components/common/number-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Textarea } from "@/shares/components/ui/textarea";

import { UTILITIES_ROUTES } from "../constants/routes";
import { ERROR_CORRECTION_LEVELS, QR_TYPES, type QrCodeDetail } from "../types/qr-code.types";
import { useQrCodeForm } from "./hooks/use-qr-code-form";

const LOGO_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Form mã QR **một form cho tạo, sửa, xem**: bố cục Studio Split cân đối 55/45.
 * Cột chính: Nội dung (tên, loại, dữ liệu) và Kiểu dáng (logo từ thư viện, màu sắc, kích thước, mức sửa lỗi).
 * Cột phụ cố định (sticky): Xem trước trực tiếp và nút tải PNG/SVG.
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
  const t = useTranslations("utilities.qrCodes");
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
        className="lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
        aside={
          <div className="sticky top-32 space-y-6">
            <FormSection
              title={t("sections.preview")}
              headerAction={
                svg && qrType ? (
                  <span className="text-muted-foreground text-xs font-normal">
                    {form.watch("size")} × {form.watch("size")}px
                  </span>
                ) : null
              }
            >
              <div className="bg-muted/30 relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border p-6 transition-all">
                {svg ? (
                  <Image
                    src={svg}
                    alt={t("previewAlt")}
                    fill
                    sizes="320px"
                    unoptimized
                    className="object-contain p-4 transition-transform"
                  />
                ) : preview.isFetching ? (
                  <Skeleton className="size-full rounded-xl" />
                ) : (
                  <p className="text-muted-foreground text-center text-sm">{t("previewEmpty")}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {code ? (
                  <Button asChild variant="outline" className="flex-1">
                    <a
                      href={code.image.url}
                      download={`${code.name}.png`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="mr-1.5 size-4" />
                      PNG
                    </a>
                  </Button>
                ) : null}
                {svg ? (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={svg} download={`${form.getValues("name") || "qr-code"}.svg`}>
                      <Download className="mr-1.5 size-4" />
                      SVG
                    </a>
                  </Button>
                ) : null}
              </div>
              {svg ? (
                <div className="bg-muted/40 text-muted-foreground flex items-center justify-between rounded-lg px-3 py-2 text-xs">
                  <span>
                    {t("fields.errorCorrection")}:{" "}
                    {t(`errorCorrection.${form.watch("errorCorrection")}`)}
                  </span>
                  <span>
                    {t("fields.margin")}: {form.watch("margin")}px
                  </span>
                </div>
              ) : null}
            </FormSection>
          </div>
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
                groupClassName="grid sm:grid-cols-3 gap-3"
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

        <FormSection title={t("sections.design")}>
          <FormField control={form.control} name="logo" label={t("sections.logo")}>
            {(field) => (
              <AttachmentImageUploadView
                value={field.value}
                onChange={(file) => {
                  if (file?.contentType && !LOGO_CONTENT_TYPES.includes(file.contentType)) {
                    form.setError("logo", { message: t("validation.logoFormat") });
                    return;
                  }
                  form.clearErrors("logo");
                  field.onChange(file);
                  if (file) {
                    form.setValue("errorCorrection", "H", { shouldDirty: true });
                    form.setValue("margin", Math.max(4, form.getValues("margin")), {
                      shouldDirty: true,
                    });
                  }
                }}
                disabled={locked}
                shape="square"
                hint={t("fields.logoHint")}
                aria-label={t("fields.logo")}
              />
            )}
          </FormField>
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
                  min={form.watch("logo") ? 4 : 0}
                  max={8}
                  integer
                  disabled={locked}
                />
              )}
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <FormField
            control={form.control}
            name="errorCorrection"
            label={t("fields.errorCorrection")}
            description={form.watch("logo") ? t("fields.logoCorrectionHint") : undefined}
          >
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked || Boolean(form.watch("logo"))}
                options={ERROR_CORRECTION_LEVELS.map((level) => ({
                  value: level,
                  label: t(`errorCorrection.${level}`),
                }))}
              />
            )}
          </FormField>
        </FormSection>
      </FormLayout>
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <Button type="button" variant="outline" asChild>
          <Link href={UTILITIES_ROUTES.qrCodes}>
            {disabled ? tCommon("back") : tCommon("cancel")}
          </Link>
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
