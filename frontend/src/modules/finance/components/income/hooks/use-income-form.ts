"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useCurrencyOptions } from "@/modules/system/hooks/use-currency-options";
import { useExchangeRateResolve } from "@/modules/system/hooks/use-exchange-rate-resolve";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";
import { formatDateTimeLocal, parseDateTimeLocal } from "@/shares/lib/date-time-input";

import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { usePlatformOptions } from "../../../hooks/use-platform-options";
import { usePlatformTaxRateResolve } from "../../../hooks/use-platform-tax-rate-resolve";
import { useSaveIncome } from "../../../hooks/use-save-income";
import { toVnd } from "../../../lib/currency";
import { grossAmount, withheldTax } from "../../../lib/tax";
import {
  INCOME_FORM_FIELDS,
  incomeSchema,
  type IncomeFormValues,
} from "../../../schemas/income.schema";
import type { Income, IncomeInput } from "../../../types/income.types";

function fromIncome(income: Income): IncomeFormValues {
  return {
    receivedAt: formatDateTimeLocal(new Date(income.receivedAt)),
    platformId: income.platformId ?? "",
    currencyId: income.currencyId,
    originalAmount: income.originalAmount ? String(Number(income.originalAmount)) : "",
    rateSource: income.rateSource === "MANUAL" ? "MANUAL" : "API",
    exchangeRate: String(Number(income.exchangeRate)),
    content: income.content,
    note: income.note,
    isTaxManual: income.isTaxManual,
    taxWithheld: income.taxWithheld,
    taxRate: String(Number(income.taxRate)),
    taxAmount: income.taxAmount ?? "",
  };
}

/**
 * State form giao dịch (nhập tay = sửa). Xem trước ngay VNĐ (tỷ giá tự động/tay) và khấu trừ theo mốc của
 * nền tảng ngày nhận; số chính thức do BE tính. Giao dịch SePay đã có số tiền thì khóa VNĐ (chỉ ghi thêm
 * số ngoại tệ gốc).
 *
 * @param income - Giao dịch đang sửa.
 * @returns Form, submit, lựa chọn, xem trước.
 */
export function useIncomeForm(income?: Income) {
  const t = useTranslations("finance.validation");
  const router = useRouter();
  const routes = useFinanceRoutes();
  const save = useSaveIncome(income?.id);
  const errorMessage = useApiErrorMessage();
  const currencies = useCurrencyOptions();
  const platforms = usePlatformOptions();
  const schema = useMemo(() => incomeSchema(t), [t]);
  const base = currencies.data?.find((currency) => currency.isBase);
  const empty: IncomeFormValues = {
    receivedAt: formatDateTimeLocal(new Date()),
    platformId: "",
    currencyId: base?.id ?? "",
    originalAmount: "",
    rateSource: "API",
    exchangeRate: "",
    content: "",
    note: "",
    isTaxManual: false,
    taxWithheld: false,
    taxRate: "0",
    taxAmount: "",
  };
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    values: income ? fromIncome(income) : base ? empty : undefined,
  });
  const values = useWatch({ control: form.control });
  const currency = currencies.data?.find((item) => item.id === values.currencyId);
  const receivedAt = parseDateTimeLocal(values.receivedAt ?? "");
  const day = receivedAt ? receivedAt.toISOString().slice(0, 10) : "";
  const isForeign = Boolean(currency && !currency.isBase);
  const sepayLocked = income?.source === "SEPAY" && income.amountStatus === "OK";
  const apiRate = useExchangeRateResolve(
    isForeign && values.rateSource === "API" && !sepayLocked ? currency?.id : undefined,
    day,
  );
  const taxEntry = usePlatformTaxRateResolve(values.platformId || undefined, day);

  const rate = sepayLocked
    ? Number(income?.exchangeRate ?? 1)
    : !isForeign
      ? 1
      : values.rateSource === "MANUAL"
        ? Number(values.exchangeRate || 0)
        : Number(apiRate.data?.rate ?? 0);
  const amount = sepayLocked
    ? Number(income?.amount ?? 0)
    : toVnd(values.originalAmount ?? "", rate);
  const autoRate = taxEntry.data?.taxWithheld ? Number(taxEntry.data.rate) : 0;
  const manualTax = values.isTaxManual && values.taxWithheld;
  const taxRate = values.isTaxManual
    ? values.taxWithheld
      ? Number(values.taxRate || 0)
      : 0
    : autoRate;
  const tax =
    manualTax && values.taxAmount ? Number(values.taxAmount) : withheldTax(amount, taxRate);
  const preview = {
    rate,
    rateDate: apiRate.data?.rateDate ?? null,
    rateError: apiRate.isError,
    amount,
    taxRate,
    tax,
    gross: manualTax && values.taxAmount ? amount + tax : grossAmount(amount, taxRate),
    hasTaxEntry: Boolean(taxEntry.data),
    isForeign,
    sepayLocked,
  };

  const onSubmit = form.handleSubmit(async (formValues) => {
    const when = parseDateTimeLocal(formValues.receivedAt);
    const input: IncomeInput = {
      receivedAt: when ? when.toISOString() : formValues.receivedAt,
      platformId: formValues.platformId || null,
      currencyId: formValues.currencyId,
      originalAmount: formValues.originalAmount,
      rateSource: formValues.rateSource,
      exchangeRate: formValues.rateSource === "MANUAL" ? formValues.exchangeRate : null,
      content: formValues.content,
      note: formValues.note,
      isTaxManual: formValues.isTaxManual,
    };
    if (formValues.isTaxManual) {
      input.taxWithheld = formValues.taxWithheld;
      input.taxRate = formValues.taxWithheld ? formValues.taxRate : "0";
      input.taxAmount =
        formValues.taxWithheld && formValues.taxAmount ? formValues.taxAmount : null;
    }
    if (sepayLocked) {
      delete input.receivedAt;
      delete input.rateSource;
      delete input.exchangeRate;
      if (currency?.isBase) delete input.originalAmount;
    }
    try {
      const saved = await save.mutateAsync(input);
      if (!income) router.push(routes.incomeDetail(saved.id));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = INCOME_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });
  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    preview,
    currency,
    currencyOptions: (currencies.data ?? [])
      .filter((item) => item.isActive || item.id === income?.currencyId)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
    platformOptions: (platforms.data ?? []).map((platform) => ({
      value: platform.id,
      label: platform.name,
    })),
    onPlatformChange: (platformId: string) => {
      form.setValue("platformId", platformId, { shouldDirty: true });
      const platform = platforms.data?.find((item) => item.id === platformId);
      if (platform && !income)
        form.setValue("currencyId", platform.defaultCurrencyId, { shouldDirty: true });
    },
  };
}
