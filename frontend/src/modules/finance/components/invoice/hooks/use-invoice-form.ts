"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useCurrencyOptions } from "@/modules/system/hooks/use-currency-options";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { useIncomeOptions } from "../../../hooks/use-income-options";
import { usePlatformOptions } from "../../../hooks/use-platform-options";
import { useSaveInvoice } from "../../../hooks/use-save-invoice";
import {
  INVOICE_FORM_FIELDS,
  invoiceSchema,
  type InvoiceFormValues,
} from "../../../schemas/invoice.schema";
import type { Invoice, InvoiceInput } from "../../../types/invoice.types";
import type { InvoiceAttachment } from "../../../types/invoice-attachment.types";

function fromInvoice(invoice: Invoice): InvoiceFormValues {
  return {
    docType: invoice.docType,
    number: invoice.number,
    issuer: invoice.issuer,
    issuerTaxCode: invoice.issuerTaxCode,
    issuedOn: invoice.issuedOn,
    periodFrom: invoice.periodFrom ?? "",
    periodTo: invoice.periodTo ?? "",
    platformId: invoice.platformId ?? "",
    currencyId: invoice.currencyId,
    originalAmount: String(Number(invoice.originalAmount)),
    originalTaxAmount: invoice.originalTaxAmount ? String(Number(invoice.originalTaxAmount)) : "",
    rateSource: invoice.rateSource === "MANUAL" ? "MANUAL" : "API",
    exchangeRate: String(Number(invoice.exchangeRate)),
    attachmentIds: invoice.attachments.map((file) => file.id),
    incomeIds: invoice.incomeIds,
    note: invoice.note,
  };
}

/**
 * State form hóa đơn: file (riêng tư, bắt buộc), giao dịch gắn (lọc theo nền tảng + năm ngày lập), tiền tệ.
 *
 * @param invoice - Hóa đơn đang sửa.
 * @returns Form, submit, lựa chọn, file đã chọn.
 */
export function useInvoiceForm(invoice?: Invoice) {
  const t = useTranslations("finance.validation");
  const router = useRouter();
  const routes = useFinanceRoutes();
  const save = useSaveInvoice(invoice?.id);
  const errorMessage = useApiErrorMessage();
  const currencies = useCurrencyOptions();
  const platforms = usePlatformOptions();
  const schema = useMemo(() => invoiceSchema(t), [t]);
  const base = currencies.data?.find((currency) => currency.isBase);
  const [files, setFiles] = useState<InvoiceAttachment[]>(invoice?.attachments ?? []);
  const empty: InvoiceFormValues = {
    docType: "WITHHOLDING_CERTIFICATE",
    number: "",
    issuer: "",
    issuerTaxCode: "",
    issuedOn: new Date().toISOString().slice(0, 10),
    periodFrom: "",
    periodTo: "",
    platformId: "",
    currencyId: base?.id ?? "",
    originalAmount: "",
    originalTaxAmount: "",
    rateSource: "API",
    exchangeRate: "",
    attachmentIds: [],
    incomeIds: [],
    note: "",
  };
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    values: invoice ? fromInvoice(invoice) : base ? empty : undefined,
  });
  const platformId = useWatch({ control: form.control, name: "platformId" });
  const issuedOn = useWatch({ control: form.control, name: "issuedOn" });
  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const year = issuedOn ? Number(issuedOn.slice(0, 4)) : undefined;
  const incomes = useIncomeOptions(
    { platform: platformId || undefined, year, amountStatus: "OK" },
    Boolean(year),
  );
  const currency = currencies.data?.find((item) => item.id === currencyId);

  const onSubmit = form.handleSubmit(async (values) => {
    const input: InvoiceInput = {
      ...values,
      periodFrom: values.periodFrom || null,
      periodTo: values.periodTo || null,
      platformId: values.platformId || null,
      originalTaxAmount: values.originalTaxAmount || null,
      exchangeRate: values.rateSource === "MANUAL" ? values.exchangeRate : null,
    };
    try {
      const saved = await save.mutateAsync(input);
      if (!invoice) router.push(routes.invoiceDetail(saved.id));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = INVOICE_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });
  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    files,
    addFiles: (selected: InvoiceAttachment[]) => {
      const merged = [
        ...files,
        ...selected.filter((file) => !files.some((item) => item.id === file.id)),
      ];
      setFiles(merged);
      form.setValue(
        "attachmentIds",
        merged.map((file) => file.id),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    removeFile: (id: string) => {
      const next = files.filter((file) => file.id !== id);
      setFiles(next);
      form.setValue(
        "attachmentIds",
        next.map((file) => file.id),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    isForeign: Boolean(currency && !currency.isBase),
    currencyOptions: (currencies.data ?? [])
      .filter((item) => item.isActive || item.id === invoice?.currencyId)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
    platformOptions: (platforms.data ?? []).map((platform) => ({
      value: platform.id,
      label: platform.name,
    })),
    incomes: incomes.data ?? [],
  };
}
