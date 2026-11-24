"use client";

import { Download, QrCode as QrCodeIcon } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ColorInput } from "@/shares/components/common/color-input";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { MoneyInput } from "@/shares/components/common/money-input";
import { NumberInput } from "@/shares/components/common/number-input";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Textarea } from "@/shares/components/ui/textarea";

import {
  ERROR_CORRECTION_LEVELS,
  QR_TYPES,
  type QrCodeDetail,
} from "@/modules/utilities/types/qr-code.types";
import { PORTAL_ROUTES } from "../../constants/routes";
import { usePortalQrCodeForm } from "./hooks/use-portal-qr-code-form";

/**
 * Form tạo và sửa mã QR trong Client Portal:
 * Giao diện tối ưu Mobile-First, hỗ trợ xem trước trực tiếp thời gian thực và tải ảnh tức thì.
 *
 * @param props - Chi tiết mã QR (khi sửa) và cờ khóa form.
 * @returns Form mã QR.
 */
export function PortalQrCodeForm({
  code,
  disabled = false,
}: {
  code?: QrCodeDetail;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.qrCodes");
  const tCommon = useTranslations("common.actions");
  const state = usePortalQrCodeForm({ code });
  const { form, preview, qrType, banks } = state;

  const locked = disabled || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const svg = preview.data?.svg;

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm font-medium">
          {rootError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cột trái: Nội dung & Kiểu dáng */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <FormSection title={t("sections.content")}>
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => (
                <Input
                  {...field}
                  maxLength={150}
                  disabled={locked}
                  placeholder={t("placeholders.name")}
                  autoFocus={!code}
                />
              )}
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
                  groupClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  options={QR_TYPES.map((value) => ({
                    value,
                    label: t(`types.${value}`),
                    description: t(`types.${value}Hint`),
                  }))}
                />
              )}
            />

            {qrType === "BANK_TRANSFER" ? (
              <div className="border-border bg-card space-y-4 rounded-xl border p-4 shadow-2xs">
                <FormField control={form.control} name="bankBin" label={t("fields.bank")} required>
                  {(field) => (
                    <SelectField
                      id={field.id}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={locked || banks.isLoading}
                      placeholder={
                        banks.isLoading
                          ? t("placeholders.bankLoading")
                          : t("placeholders.bankSelect")
                      }
                      options={
                        banks.data?.map((b) => ({
                          value: b.bin,
                          label: `${b.shortName} — ${b.name}`,
                        })) ?? []
                      }
                    />
                  )}
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    label={t("fields.accountNumber")}
                    required
                  >
                    {(field) => (
                      <Input
                        {...field}
                        maxLength={19}
                        disabled={locked}
                        placeholder={t("placeholders.accountNumber")}
                        inputMode="numeric"
                      />
                    )}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="accountName"
                    label={t("fields.accountName")}
                    required
                  >
                    {(field) => (
                      <Input
                        {...field}
                        maxLength={50}
                        disabled={locked}
                        placeholder={t("placeholders.accountName")}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    )}
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="amount" label={t("fields.amount")}>
                    {(field) => (
                      <MoneyInput
                        id={field.id}
                        value={field.value === "" ? null : field.value}
                        onChange={(val) => field.onChange(val ?? "")}
                        disabled={locked}
                        placeholder={t("placeholders.amount")}
                      />
                    )}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="message"
                    label={t("fields.message")}
                    description={t("fields.messageHint")}
                  >
                    {(field) => (
                      <Input
                        {...field}
                        maxLength={25}
                        disabled={locked}
                        placeholder={t("placeholders.message")}
                      />
                    )}
                  </FormField>
                </div>
              </div>
            ) : null}

            {qrType === "URL" ? (
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
                    disabled={locked}
                    placeholder={t("placeholders.url")}
                  />
                )}
              </FormField>
            ) : null}

            {qrType === "TEXT" ? (
              <FormField control={form.control} name="text" label={t("fields.text")} required>
                {(field) => (
                  <Textarea
                    {...field}
                    rows={4}
                    maxLength={1000}
                    disabled={locked}
                    placeholder={t("placeholders.text")}
                  />
                )}
              </FormField>
            ) : null}
          </FormSection>

          <FormSection title={t("sections.design")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="foreground" label={t("fields.foreground")}>
                {(field) => (
                  <ColorInput {...field} pickerLabel={t("fields.foreground")} disabled={locked} />
                )}
              </FormField>
              <FormField control={form.control} name="background" label={t("fields.background")}>
                {(field) => (
                  <ColorInput {...field} pickerLabel={t("fields.background")} disabled={locked} />
                )}
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField control={form.control} name="size" label={t("fields.size")}>
                {(field) => (
                  <NumberInput
                    id={field.id}
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 512)}
                    min={128}
                    max={1024}
                    step={64}
                    disabled={locked}
                  />
                )}
              </FormField>

              <FormField control={form.control} name="margin" label={t("fields.margin")}>
                {(field) => (
                  <NumberInput
                    id={field.id}
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 2)}
                    min={0}
                    max={8}
                    disabled={locked}
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
                    options={ERROR_CORRECTION_LEVELS.map((lvl) => ({
                      value: lvl,
                      label: t(`errorCorrection.${lvl}`),
                    }))}
                  />
                )}
              </FormField>
            </div>
          </FormSection>
        </div>

        {/* Cột phải: Live Preview trực tiếp */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 space-y-4">
            <Card className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
              <div className="border-border/60 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
                <span className="text-foreground text-xs font-semibold">
                  {t("sections.preview")}
                </span>
                {svg ? (
                  <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 font-mono text-[10px] font-medium">
                    {form.watch("size")} × {form.watch("size")}px
                  </span>
                ) : null}
              </div>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="border-border bg-muted/20 relative flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-2xl border p-4 shadow-inner">
                  {svg ? (
                    <Image
                      src={svg}
                      alt={t("previewAlt")}
                      fill
                      sizes="280px"
                      unoptimized
                      className="object-contain p-3 transition-transform"
                    />
                  ) : preview.isFetching ? (
                    <Skeleton className="size-full rounded-xl" />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center gap-2 text-center text-xs">
                      <QrCodeIcon className="size-10 stroke-1 opacity-40" />
                      <p>{t("previewEmpty")}</p>
                    </div>
                  )}
                </div>

                {/* Các nút tải ảnh QR nhanh */}
                <div className="mt-4 flex w-full flex-wrap gap-2">
                  {code?.image?.url ? (
                    <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                      <NextLink
                        href={code.image.url}
                        download={`${code.name || "qr-code"}.png`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="mr-1.5 size-3.5" />
                        <span>{t("downloadPng")}</span>
                      </NextLink>
                    </Button>
                  ) : null}
                  {svg ? (
                    <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                      <NextLink href={svg} download={`${form.getValues("name") || "qr-code"}.svg`}>
                        <Download className="mr-1.5 size-3.5" />
                        <span>{t("downloadSvg")}</span>
                      </NextLink>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        <Button type="button" variant="outline" asChild>
          <Link href={PORTAL_ROUTES.qrCodes}>{disabled ? tCommon("back") : tCommon("cancel")}</Link>
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
