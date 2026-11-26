"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useSaveReminder } from "../../../hooks/use-save-reminder";
import {
  REMINDER_FORM_FIELDS,
  reminderSchema,
  type ReminderFormValues,
} from "../../../schemas/reminder.schema";
import type { Reminder, ReminderInput } from "../../../types/reminder.types";

function toFormValues(item: Reminder): ReminderFormValues {
  return {
    title: item.title,
    description: item.description,
    dueDate: item.dueDate,
    dueTime: item.dueTime ? item.dueTime.slice(0, 5) : "",
    notifyMinutesBefore: String(item.notifyMinutesBefore ?? 30),
    priority: item.priority,
    recurrence: item.recurrence,
    anchorDay: item.anchorDay !== null ? String(item.anchorDay) : "",
    tags: item.tags ?? [],
    notificationChannels: item.notificationChannels?.length
      ? item.notificationChannels
      : ["WEBSITE"],
  };
}

/**
 * Form state Nhắc việc: dùng được cả trên trang Tạo/Chi tiết lẫn trong `FormDialog` trên Lịch.
 *
 * @param reminder - Nhắc việc đang sửa (trống khi tạo mới).
 * @param options - Ngày mặc định và callback sau khi lưu thành công trong dialog.
 * @returns State form Nhắc việc.
 */
export function useReminderForm(
  reminder?: Reminder,
  options: { defaultDueDate?: string; onSaved?: (item: Reminder) => void } = {},
) {
  const tValidation = useTranslations("workspace.validation");
  const tCommon = useTranslations("workspace.common");
  const router = useRouter();
  const save = useSaveReminder(reminder?.id);
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => reminderSchema(tValidation), [tValidation]);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: options.defaultDueDate || new Date().toISOString().slice(0, 10),
      dueTime: "",
      notifyMinutesBefore: "30",
      priority: "MEDIUM",
      recurrence: "NONE",
      anchorDay: "",
      tags: [],
      notificationChannels: ["WEBSITE"],
    },
    values: reminder ? toFormValues(reminder) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const input: ReminderInput = {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      dueTime: values.dueTime || null,
      notifyMinutesBefore: values.notifyMinutesBefore ? Number(values.notifyMinutesBefore) : 30,
      priority: values.priority,
      recurrence: values.recurrence,
      anchorDay: values.anchorDay ? Number(values.anchorDay) : null,
      tags: values.tags,
      notificationChannels: values.notificationChannels,
    };
    try {
      const saved = await save.mutateAsync(input);
      toast.success(tCommon(reminder ? "updated" : "created"));
      if (options.onSaved) {
        options.onSaved(saved);
      } else if (!reminder) {
        router.push(WORKSPACE_ROUTES.reminderDetail(saved.id));
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = REMINDER_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
    }
  });

  return { form, onSubmit, isSubmitting: save.isPending };
}
