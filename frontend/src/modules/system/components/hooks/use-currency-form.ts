"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useSaveCurrency } from "../../hooks/use-save-currency";
import { currencySchema, type CurrencyFormValues } from "../../schemas/currency.schema";
import type { Currency } from "../../types/currency.types";

/** @param currency - Tiền tệ đang sửa. @returns Form tiền tệ. */
export function useCurrencyForm(currency?: Currency) {
  const t = useTranslations("system.currencies.validation");
  const router = useRouter();
  const save = useSaveCurrency();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => currencySchema(t), [t]);
  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      decimalPlaces: "2",
      isActive: true,
      position: "10",
    },
    values: currency
      ? {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          decimalPlaces: String(currency.decimalPlaces),
          isActive: currency.isActive,
          position: String(currency.position),
        }
      : undefined,
  });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        id: currency?.id,
        input: {
          ...values,
          decimalPlaces: Number(values.decimalPlaces),
          position: Number(values.position),
        },
      });
      router.push(SYSTEM_ROUTES.currencies);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });
  return { form, onSubmit, isSubmitting: save.isPending };
}
