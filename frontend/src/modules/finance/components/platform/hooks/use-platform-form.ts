"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { useCurrencyOptions } from "@/modules/system/hooks/use-currency-options";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { financeKeys } from "../../../constants/query-keys";
import { useClassificationRules } from "../../../hooks/use-classification-rules";
import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { useSavePlatform } from "../../../hooks/use-save-platform";
import {
  PLATFORM_FORM_FIELDS,
  platformSchema,
  type PlatformFormValues,
} from "../../../schemas/platform.schema";
import { classificationRuleService } from "../../../services/classification-rule.service";
import type { DraftClassificationRule } from "../../../types/classification-rule.types";
import type { Platform } from "../../../types/platform.types";

/**
 * State form nền tảng (tạo = sửa) kèm state Dialog phím tắt `+` quản lý quy tắc phân loại (`Alt+R`).
 *
 * @param platform - Nền tảng đang sửa.
 * @param canReadRules - Có quyền xem danh sách quy tắc phân loại hay không.
 * @returns Form, submit, lựa chọn tiền tệ & state dialog quy tắc phân loại.
 */
export function usePlatformForm(platform?: Platform, canReadRules = true) {
  const t = useTranslations("finance.validation");
  const router = useRouter();
  const routes = useFinanceRoutes();
  const queryClient = useQueryClient();
  const save = useSavePlatform(platform?.id);
  const errorMessage = useApiErrorMessage();
  const currencies = useCurrencyOptions();
  const schema = useMemo(() => platformSchema(t), [t]);
  const base = currencies.data?.find((currency) => currency.isBase);

  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [draftRules, setDraftRules] = useState<DraftClassificationRule[]>([]);

  const existingRulesQuery = useClassificationRules(
    { platform: platform?.id, pageSize: 1 },
    { enabled: Boolean(platform?.id) && canReadRules },
  );

  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      defaultCurrencyId: base?.id ?? "",
      color: "",
      isActive: true,
      note: "",
    },
    values: platform
      ? {
          name: platform.name,
          code: platform.code,
          defaultCurrencyId: platform.defaultCurrencyId,
          color: platform.color ?? "",
          isActive: platform.isActive,
          note: platform.note,
        }
      : undefined,
  });

  const platformName = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (!platform && base?.id && !form.getValues("defaultCurrencyId")) {
      form.setValue("defaultCurrencyId", base.id, { shouldDirty: false });
    }
  }, [platform, base?.id, form]);

  useEffect(() => {
    if (!canReadRules) return;
    function handleShortcut(event: KeyboardEvent) {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        setRulesDialogOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [canReadRules]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      if (!platform && draftRules.length > 0) {
        for (const draft of draftRules) {
          await classificationRuleService.create({
            name: draft.name,
            platformId: saved.id,
            pattern: draft.pattern,
            priority: draft.priority,
            isActive: draft.isActive,
          });
        }
        await queryClient.invalidateQueries({ queryKey: financeKeys.all });
      }
      if (!platform) router.push(routes.platformDetail(saved.id));
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

  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    currencyOptions,
    platformName: platformName ?? platform?.name ?? "",
    rulesDialogOpen,
    setRulesDialogOpen,
    draftRules,
    setDraftRules,
    rulesCount: platform ? (existingRulesQuery.data?.pagination.total ?? 0) : draftRules.length,
  };
}
