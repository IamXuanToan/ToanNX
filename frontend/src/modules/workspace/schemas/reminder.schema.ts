import { z } from "zod";

import {
  REMINDER_PRIORITIES,
  REMINDER_RECURRENCES,
  WORKSPACE_NOTIFICATION_CHANNELS,
} from "../constants/defaults";

type Translate = (key: "required" | "notifyMinutes" | "anchorDay" | "atLeastOneChannel") => string;

/** Tên trường form Nhắc việc cá nhân. */
export const REMINDER_FORM_FIELDS = [
  "title",
  "description",
  "dueDate",
  "dueTime",
  "notifyMinutesBefore",
  "priority",
  "recurrence",
  "anchorDay",
  "tags",
  "notificationChannels",
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
      priority: z.enum(REMINDER_PRIORITIES),
      recurrence: z.enum(REMINDER_RECURRENCES),
      anchorDay: z.string().trim(),
      tags: z.array(z.string()),
      notificationChannels: z
        .array(z.enum(WORKSPACE_NOTIFICATION_CHANNELS))
        .min(1, t("atLeastOneChannel")),
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
      if (
        value.anchorDay &&
        (!/^\d+$/.test(value.anchorDay) ||
          Number(value.anchorDay) < 1 ||
          Number(value.anchorDay) > 31)
      ) {
        ctx.addIssue({ code: "custom", path: ["anchorDay"], message: t("anchorDay") });
      }
    });
}

export type ReminderFormValues = z.infer<ReturnType<typeof reminderSchema>>;
