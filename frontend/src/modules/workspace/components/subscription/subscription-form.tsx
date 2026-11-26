"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { DatePicker } from "@/shares/components/common/date-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Textarea } from "@/shares/components/ui/textarea";

import { BILLING_CYCLES, SUBSCRIPTION_CATEGORIES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Subscription } from "../../types/subscription.types";
import { useSubscriptionForm } from "./hooks/use-subscription-form";

/**
 * Form Tạo / Sửa Dịch vụ định kỳ (chu kỳ, ngày gia hạn, nguyên tệ + tỷ giá, auto-renew).
 *
 * @param props - Bản ghi dịch vụ (khi sửa) và trạng thái chỉ xem/khóa.
 * @returns Form Dịch vụ định kỳ.
 */
export function SubscriptionForm({
  subscription,
  disabled = false,
}: {
  subscription?: Subscription;
  disabled?: boolean;
}) {
  const t = useTranslations("workspace.subscriptions");
  const tCommon = useTranslations("common.actions");
  const state = useSubscriptionForm(subscription);
  const { form } = state;
  const locked = disabled || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}

      <FormSection title={t("editTitle")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="name" label={t("fields.name")} required>
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
          <FormField control={form.control} name="provider" label={t("fields.provider")}>
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
          <FormField control={form.control} name="category" label={t("fields.category")}>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={SUBSCRIPTION_CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`categories.${c}`),
                }))}
              />
            )}
          </FormField>
          <FormField control={form.control} name="billingCycle" label={t("fields.billingCycle")}>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={BILLING_CYCLES.map((c) => ({ value: c, label: t(`cycles.${c}`) }))}
              />
            )}
          </FormField>
          {state.isCustomCycle ? (
            <FormField
              control={form.control}
              name="customCycleDays"
              label={t("fields.customCycleDays")}
              required
            >
              {(field) => (
                <NumberInput
                  {...field}
                  integer
                  onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                  disabled={locked}
                  className="h-10"
                />
              )}
            </FormField>
          ) : null}
          <FormField control={form.control} name="anchorDay" label={t("fields.anchorDay")}>
            {(field) => (
              <NumberInput
                {...field}
                integer
                onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                disabled={locked}
                className="h-10"
              />
            )}
          </FormField>
          <FormField control={form.control} name="amount" label={t("fields.amount")} required>
            {(field) => (
              <NumberInput
                {...field}
                onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                disabled={locked}
                className="h-10"
              />
            )}
          </FormField>
          <FormField
            control={form.control}
            name="currencyId"
            label={t("fields.currencyId")}
            required
          >
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={state.currencyOptions}
              />
            )}
          </FormField>
          {state.isForeign ? (
            <FormField control={form.control} name="exchangeRate" label={t("fields.exchangeRate")}>
              {(field) => (
                <NumberInput
                  {...field}
                  onChange={(val) => field.onChange(val === "" ? "" : String(val))}
                  disabled={locked}
                  className="h-10"
                />
              )}
            </FormField>
          ) : null}
          <FormField control={form.control} name="renewDate" label={t("fields.renewDate")} required>
            {(field) => (
              <DatePicker
                id={field.id}
                value={field.value}
                onChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
              />
            )}
          </FormField>
          <FormField control={form.control} name="paymentMethod" label={t("fields.paymentMethod")}>
            {(field) => <Input {...field} disabled={locked} className="h-10" />}
          </FormField>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="manageUrl" label={t("fields.manageUrl")}>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Controller
              control={form.control}
              name="autoRenew"
              render={({ field }) => (
                <Checkbox
                  id="sub-auto-renew"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  disabled={locked}
                />
              )}
            />
            <Label htmlFor="sub-auto-renew">{t("fields.autoRenew")}</Label>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  id="sub-is-active"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  disabled={locked}
                />
              )}
            />
            <Label htmlFor="sub-is-active">{t("fields.isActive")}</Label>
          </div>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="notes" label={t("fields.notes")}>
              {(field) => <Textarea {...field} disabled={locked} rows={3} />}
            </FormField>
          </div>
        </div>
      </FormSection>

      {disabled ? null : (
        <FormActions>
          <Button asChild type="button" variant="outline">
            <Link href={WORKSPACE_ROUTES.subscriptions}>{tCommon("cancel")}</Link>
          </Button>
          <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
        </FormActions>
      )}
    </Form>
  );
}
