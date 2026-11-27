"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useCurrencyOptions } from "@/modules/system/hooks/use-currency-options";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useSaveSubscription } from "../../../hooks/use-save-subscription";
import {
  SUBSCRIPTION_FORM_FIELDS,
  subscriptionSchema,
  type SubscriptionFormValues,
} from "../../../schemas/subscription.schema";
import type { Subscription, SubscriptionInput } from "../../../types/subscription.types";

function toFormValues(sub: Subscription): SubscriptionFormValues {
  return {
    name: sub.name,
    provider: sub.provider,
    category: sub.category,
    billingCycle: sub.billingCycle,
    customCycleDays: sub.customCycleDays !== null ? String(sub.customCycleDays) : "",
    anchorDay: sub.anchorDay ? String(sub.anchorDay) : "",
    amount: sub.amount ? String(Number(sub.amount)) : "",
    currencyId: sub.currencyId,
    exchangeRate:
      sub.exchangeRate && Number(sub.exchangeRate) !== 1 ? String(Number(sub.exchangeRate)) : "",
    renewDate: sub.renewDate,
    autoRenew: sub.autoRenew,
    paymentMethod: sub.paymentMethod,
    manageUrl: sub.manageUrl,
    reminderDaysBefore: sub.reminderDaysBefore ?? [7, 3, 1],
    isActive: sub.isActive,
    notes: sub.notes,
  };
}

/** @param subscription - Dịch vụ đang sửa. @returns State form Dịch vụ định kỳ. */
export function useSubscriptionForm(subscription?: Subscription) {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const router = useRouter();
  const save = useSaveSubscription(subscription?.id);
  const errorMessage = useApiErrorMessage();
  const currencies = useCurrencyOptions();
  const baseCurrency = currencies.data?.find((c) => c.isBase);
  const schema = useMemo(() => subscriptionSchema(tValidation), [tValidation]);

  const empty: SubscriptionFormValues = {
    name: "",
    provider: "",
    category: "HOSTING_VPS",
    billingCycle: "MONTHLY",
    customCycleDays: "",
    anchorDay: "",
    amount: "",
    currencyId: baseCurrency?.id ?? "",
    exchangeRate: "",
    renewDate: new Date().toISOString().slice(0, 10),
    autoRenew: false,
    paymentMethod: "",
    manageUrl: "",
    reminderDaysBefore: [7, 3, 1],
    isActive: true,
    notes: "",
  };

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    values: subscription ? toFormValues(subscription) : baseCurrency ? empty : undefined,
  });

  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const billingCycle = useWatch({ control: form.control, name: "billingCycle" });
  const selectedCurrency = currencies.data?.find((c) => c.id === currencyId);

  const onSubmit = form.handleSubmit(async (values) => {
    const input: SubscriptionInput = {
      name: values.name,
      provider: values.provider,
      category: values.category,
      billingCycle: values.billingCycle,
      customCycleDays:
        values.billingCycle === "CUSTOM_DAYS" && values.customCycleDays
          ? Number(values.customCycleDays)
          : null,
      anchorDay: values.anchorDay ? Number(values.anchorDay) : null,
      amount: values.amount,
      currencyId: values.currencyId,
      exchangeRate: values.exchangeRate || null,
      renewDate: values.renewDate,
      autoRenew: values.autoRenew,
      paymentMethod: values.paymentMethod,
      manageUrl: values.manageUrl,
      reminderDaysBefore: values.reminderDaysBefore,
      isActive: values.isActive,
      notes: values.notes,
    };
    try {
      const saved = await save.mutateAsync(input);
      if (!subscription) {
        toast.success(tCommon("created"));
        router.push(WORKSPACE_ROUTES.subscriptionDetail(saved.id));
      } else {
        toast.success(tCommon("updated"));
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = SUBSCRIPTION_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: save.isPending,
    isCustomCycle: billingCycle === "CUSTOM_DAYS",
    isForeign: Boolean(selectedCurrency && !selectedCurrency.isBase),
    currencyOptions: (currencies.data ?? [])
      .filter((item) => item.isActive || item.id === subscription?.currencyId)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  };
}
