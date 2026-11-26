"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DatePicker } from "@/shares/components/common/date-picker";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { NumberInput } from "@/shares/components/common/number-input";
import { SelectField } from "@/shares/components/common/select-field";
import { TagsInput } from "@/shares/components/common/tags-input";
import { TimePicker } from "@/shares/components/common/time-picker";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Textarea } from "@/shares/components/ui/textarea";

import { REMINDER_PRIORITIES, REMINDER_RECURRENCES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Reminder } from "../../types/reminder.types";
import { useReminderForm } from "./hooks/use-reminder-form";

/**
 * Form Tạo / Sửa Nhắc việc cá nhân (tái sử dụng cả trang riêng lẫn trong `FormDialog` trên Lịch).
 *
 * @param props - Nhắc việc (khi sửa), khóa form, ngày mặc định, callback lưu/hủy cho modal.
 * @returns Form Nhắc việc.
 */
export function ReminderForm({
  reminder,
  disabled = false,
  defaultDueDate,
  onSaved,
  onCancel,
}: {
  reminder?: Reminder;
  disabled?: boolean;
  defaultDueDate?: string;
  onSaved?: (item: Reminder) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("workspace.reminders");
  const tCommon = useTranslations("common.actions");
  const state = useReminderForm(reminder, { defaultDueDate, onSaved });
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

      <FormSection title={reminder ? t("editTitle") : t("createTitle")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField control={form.control} name="title" label={t("fields.title")} required>
              {(field) => <Input {...field} disabled={locked} className="h-10" />}
            </FormField>
          </div>
          <FormField control={form.control} name="dueDate" label={t("fields.dueDate")} required>
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
          <FormField control={form.control} name="dueTime" label={t("fields.dueTime")}>
            {(field) => (
              <TimePicker value={field.value} onChange={field.onChange} disabled={locked} />
            )}
          </FormField>
          <FormField control={form.control} name="priority" label={t("fields.priority")}>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={REMINDER_PRIORITIES.map((p) => ({
                  value: p,
                  label: t(`priorities.${p}`),
                }))}
              />
            )}
          </FormField>
          <FormField control={form.control} name="recurrence" label={t("fields.recurrence")}>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
                invalid={field["aria-invalid"]}
                options={REMINDER_RECURRENCES.map((r) => ({
                  value: r,
                  label: t(`recurrences.${r}`),
                }))}
              />
            )}
          </FormField>
          <FormField
            control={form.control}
            name="notifyMinutesBefore"
            label={t("fields.notifyMinutesBefore")}
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
          <div className="sm:col-span-2">
            <FormField control={form.control} name="tags" label={t("fields.tags")}>
              {(field) => (
                <TagsInput value={field.value} onChange={field.onChange} disabled={locked} />
              )}
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField control={form.control} name="description" label={t("fields.description")}>
              {(field) => <Textarea {...field} disabled={locked} rows={3} />}
            </FormField>
          </div>
        </div>
      </FormSection>

      {disabled ? null : (
        <FormActions>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
          ) : (
            <Button asChild type="button" variant="outline">
              <Link href={WORKSPACE_ROUTES.reminders}>{tCommon("cancel")}</Link>
            </Button>
          )}
          <FormSubmitButton isSubmitting={state.isSubmitting}>{tCommon("save")}</FormSubmitButton>
        </FormActions>
      )}
    </Form>
  );
}
