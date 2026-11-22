"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useCurrencyOptions } from "@/modules/system/hooks/use-currency-options";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { FINANCE_ROUTES } from "../../../constants/routes";
import { useSavePlatform } from "../../../hooks/use-save-platform";
import {
  PLATFORM_FORM_FIELDS,
  platformSchema,
  type PlatformFormValues,
} from "../../../schemas/platform.schema";
import type { Platform } from "../../../types/platform.types";

/**
 * State form nền tảng (tạo = sửa). Tạo xong sang trang chi tiết để thêm lịch sử khấu trừ.
 *
 * @param platform - Nền tảng đang sửa.
 * @returns Form, submit, lựa chọn tiền tệ.
 */
export function usePlatformForm(platform?: Platform) {
  const t = useTranslations("finance.validation");
  const router = useRouter();
  const save = useSavePlatform(platform?.id);
  const errorMessage = useApiErrorMessage();
  const currencies = useCurrencyOptions();
  const schema = useMemo(() => platformSchema(t), [t]);
  const base = currencies.data?.find((currency) => currency.isBase);
  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      defaultCurrencyId: base?.id ?? "",
      isActive: true,
      note: "",
    },
    values: platform
      ? {
          name: platform.name,
          code: platform.code,
          defaultCurrencyId: platform.defaultCurrencyId,
          isActive: platform.isActive,
          note: platform.note,
        }
      : base
        ? { name: "", code: "", defaultCurrencyId: base.id, isActive: true, note: "" }
        : undefined,
  });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      if (!platform) router.push(FINANCE_ROUTES.platformDetail(saved.id));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = PLATFORM_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });
  const currencyOptions = (currencies.data ?? [])
    .filter((currency) => currency.isActive || currency.id === platform?.defaultCurrencyId)
    .map((currency) => ({ value: currency.id, label: `${currency.code} · ${currency.name}` }));
  return { form, onSubmit, isSubmitting: save.isPending, currencyOptions };
}
