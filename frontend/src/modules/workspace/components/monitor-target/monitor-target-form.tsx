"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
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

import { MONITOR_METHODS } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { MonitorTarget } from "../../types/monitor-target.types";
import { useMonitorTargetForm } from "./hooks/use-monitor-target-form";

/**
 * Form Tạo / Sửa Endpoint giám sát Uptime/HTTP.
 *
 * @param props - Endpoint (khi sửa) và trạng thái khóa.
 * @returns Form endpoint Uptime.
 */
export function MonitorTargetForm({
  target,
  disabled = false,
}: {
  target?: MonitorTarget;
  disabled?: boolean;
}) {
  const t = useTranslations("workspace.monitors");
  const tCommon = useTranslations("common.actions");
  const state = useMonitorTargetForm(target);
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
          <FormField control={form.control} name="method" label={t("fields.method")}>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={MONITOR_METHODS.map((m) => ({ value: m, label: m }))}
              />
            )}
          </FormField>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="url" label={t("fields.url")} required>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
          </div>
          <FormField
            control={form.control}
            name="expectedStatus"
            label={t("fields.expectedStatus")}
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
          <FormField
            control={form.control}
            name="timeoutSeconds"
            label={t("fields.timeoutSeconds")}
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
          <FormField
            control={form.control}
            name="checkIntervalMinutes"
            label={t("fields.checkIntervalMinutes")}
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
          <div className="flex items-center gap-2 pt-6">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  id="monitor-is-active"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  disabled={locked}
                />
              )}
            />
            <Label htmlFor="monitor-is-active">{t("fields.isActive")}</Label>
          </div>
        </div>
      </FormSection>

      {disabled ? null : (
        <FormActions>
          <Button asChild type="button" variant="outline">
            <Link href={WORKSPACE_ROUTES.monitors}>{tCommon("cancel")}</Link>
          </Button>
          <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
        </FormActions>
      )}
    </Form>
  );
}
