"use client";

import { useTranslations } from "next-intl";

import { DatePicker } from "@/shares/components/common/date-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormDialog } from "@/shares/components/common/form-dialog";
import { FormField } from "@/shares/components/common/form-field";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import type { Subscription } from "../../types/subscription.types";
import { AssetInvoicesField } from "../asset/asset-invoices-field";
import { useSubscriptionRenewDialog } from "./hooks/use-subscription-renew-dialog";

/**
 * Dialog Gia hạn Dịch vụ định kỳ: ghi nhận kỳ thanh toán, biên lai riêng tư và cộng lùi `renew_date`.
 *
 * @param props - Dịch vụ, trạng thái mở, callback đóng.
 * @returns Dialog Gia hạn.
 */
export function SubscriptionRenewDialog({
  subscription,
  open,
  onOpenChange,
}: {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("workspace.subscriptions");
  const tCommon = useTranslations("common.actions");
  const state = useSubscriptionRenewDialog(subscription, () => onOpenChange(false));
  const { form } = state;
  const rootError = form.formState.errors.root?.message;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("renewTitle", { name: subscription.name })}
    >
      <Form onSubmit={state.onSubmit} className="space-y-4">
        {rootError ? (
          <p role="alert" className="text-destructive text-sm">
            {rootError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="paidOn" label={t("renewFields.paidOn")}>
            {(field) => <DatePicker id={field.id} value={field.value} onChange={field.onChange} />}
          </FormField>
          <FormField control={form.control} name="advanceFrom" label={t("renewFields.advanceFrom")}>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: "cycle", label: t("advanceFromCycle") },
                  { value: "today", label: t("advanceFromToday") },
                ]}
              />
            )}
          </FormField>
          <FormField
            control={form.control}
            name="amount"
            label={`${t("renewFields.amount")} (${subscription.currencyCode})`}
          >
            {(field) => (
              <NumberInput
                {...field}
                onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                className="h-10"
              />
            )}
          </FormField>
          {subscription.currencyCode !== "VND" ? (
            <FormField
              control={form.control}
              name="exchangeRate"
              label={t("renewFields.exchangeRate")}
            >
              {(field) => (
                <NumberInput
                  {...field}
                  onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                  className="h-10"
                />
              )}
            </FormField>
          ) : null}
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="paymentMethod"
              label={t("renewFields.paymentMethod")}
            >
              {(field) => <Input {...field} className="h-10" />}
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="receiptAttachmentId"
              label={t("renewFields.receiptAttachmentId")}
            >
              {() => (
                <AssetInvoicesField
                  files={state.receiptFiles}
                  multiple={false}
                  onAdd={state.selectReceipt}
                  onRemove={() => state.clearReceipt()}
                />
              )}
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="note" label={t("renewFields.note")}>
              {(field) => <Textarea {...field} rows={2} />}
            </FormField>
          </div>
        </div>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <FormSubmitButton isSubmitting={state.isSubmitting}>{t("renew")}</FormSubmitButton>
        </FormActions>
      </Form>
    </FormDialog>
  );
}
