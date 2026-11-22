"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useCurrencyOptions } from "../../hooks/use-currency-options";
import { useSaveExchangeRate } from "../../hooks/use-save-exchange-rate";
import {
  exchangeRateSchema,
  type ExchangeRateFormValues,
} from "../../schemas/exchange-rate.schema";

/** @returns Form nhập tay tỷ giá (ngoại tệ). */
export function useExchangeRateForm() {
  const t = useTranslations("system.exchangeRates.validation");
  const router = useRouter();
  const save = useSaveExchangeRate();
  const currencies = useCurrencyOptions();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => exchangeRateSchema(t), [t]);
  const form = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currencyId: "",
      rateDate: new Date().toISOString().slice(0, 10),
      rate: "",
      note: "",
    },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ input: values });
      router.push(SYSTEM_ROUTES.exchangeRates);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });
  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    currencyOptions: (currencies.data ?? [])
      .filter((item) => !item.isBase)
      .map((item) => ({ value: item.id, label: item.code })),
  };
}
