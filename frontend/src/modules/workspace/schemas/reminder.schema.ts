import { z } from "zod";

import { REMINDER_PRIORITIES, REMINDER_RECURRENCES } from "../constants/defaults";

type Translate = (key: "required" | "notifyMinutes") => string;

/** Tên trường form Nhắc việc cá nhân. */
export const REMINDER_FORM_FIELDS = [
  "title",
  "description",
  "dueDate",
  "dueTime",
  "notifyMinutesBefore",
  "reminderDaysBefore",
  "priority",
  "recurrence",
  "topicId",
] as const;

/**
 * Schema form Nhắc việc cá nhân.
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function reminderSchema(t: Translate) {
  return z
    .object({
      title: z.string().trim().min(1, t("required")).max(200),
      description: z.string().max(2000),
      dueDate: z.string().min(1, t("required")),
      dueTime: z.string(),
      notifyMinutesBefore: z.string().trim(),
      reminderDaysBefore: z.array(z.string()),
      priority: z.enum(REMINDER_PRIORITIES),
      recurrence: z.enum(REMINDER_RECURRENCES),
      topicId: z.string(),
    })
    .superRefine((value, ctx) => {
      if (
        value.notifyMinutesBefore &&
        (!/^\d+$/.test(value.notifyMinutesBefore) || Number(value.notifyMinutesBefore) > 10080)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["notifyMinutesBefore"],
          message: t("notifyMinutes"),
        });
      }
    });
}

export type ReminderFormValues = z.infer<ReturnType<typeof reminderSchema>>;
