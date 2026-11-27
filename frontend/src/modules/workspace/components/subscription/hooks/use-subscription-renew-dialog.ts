"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Attachment } from "@/modules/system/types/attachment.types";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { useRenewSubscription } from "../../../hooks/use-renew-subscription";
import {
  SUBSCRIPTION_RENEW_FORM_FIELDS,
  subscriptionRenewSchema,
  type SubscriptionRenewFormValues,
} from "../../../schemas/subscription-renew.schema";
import type { Subscription } from "../../../types/subscription.types";

/** @param subscription - Dịch vụ cần gia hạn. @returns State form modal Gia hạn. */
export function useSubscriptionRenewDialog(subscription: Subscription, onSuccessClose: () => void) {
  const t = useTranslations("workspace.subscriptions");
  const tValidation = useTranslations("workspace.validation");
  const renew = useRenewSubscription(subscription.id);
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => subscriptionRenewSchema(tValidation), [tValidation]);
  const [receiptFiles, setReceiptFiles] = useState<Attachment[]>([]);

  const form = useForm<SubscriptionRenewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidOn: new Date().toISOString().slice(0, 10),
      amount: subscription.amount ? String(Number(subscription.amount)) : "",
      exchangeRate: "",
      paymentMethod: subscription.paymentMethod || "",
      receiptAttachmentId: "",
      note: "",
      advanceFrom: "cycle",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await renew.mutateAsync({
        paidOn: values.paidOn || null,
        amount: values.amount || null,
        exchangeRate: values.exchangeRate || null,
        paymentMethod: values.paymentMethod,
        receiptAttachmentId: values.receiptAttachmentId || null,
        note: values.note,
        advanceFrom: values.advanceFrom,
      });
      toast.success(t("renewSuccess"));
      onSuccessClose();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = SUBSCRIPTION_RENEW_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: renew.isPending,
    receiptFiles,
    selectReceipt: (selected: Attachment[]) => {
      const latest = selected.slice(-1);
      setReceiptFiles(latest);
      form.setValue("receiptAttachmentId", latest[0]?.id ?? "", { shouldDirty: true });
    },
    clearReceipt: () => {
      setReceiptFiles([]);
      form.setValue("receiptAttachmentId", "", { shouldDirty: true });
    },
  };
}
