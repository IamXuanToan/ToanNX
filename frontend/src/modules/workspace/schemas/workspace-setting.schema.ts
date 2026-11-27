import { z } from "zod";

type Translate = (key: "required" | "timeSlot" | "alertDay") => string;

const HHMM_SLOT = /^([01]\d|2[0-3]):[0-5]\d$/;
const ALERT_DAY_PATTERN = /^\d+$/;

/** Tên trường form Cài đặt Digest & Cảnh báo cá nhân. */
export const WORKSPACE_SETTING_FORM_FIELDS = [
  "timezone",
  "dailyDigestEnabled",
  "digestTimeSlots",
  "digestSections",
  "warrantyAlertDays",
  "subscriptionDefaultAlertDays",
  "telegramAllowedChatIds",
] as const;

/**
 * Schema form Cài đặt cá nhân: Múi giờ, Digest, mốc nhắc dạng danh sách chip & kênh Telegram.
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function workspaceSettingSchema(t: Translate) {
  return z
    .object({
      timezone: z.string().trim().min(1, t("required")).max(64),
      dailyDigestEnabled: z.boolean(),
      digestTimeSlots: z.array(z.string().trim()),
      digestSections: z.array(z.string()),
      warrantyAlertDays: z.array(z.string().trim()),
      subscriptionDefaultAlertDays: z.array(z.string().trim()),
      telegramAllowedChatIds: z.array(z.string()),
    })
    .superRefine((value, ctx) => {
      if (value.digestTimeSlots.some((slot) => !HHMM_SLOT.test(slot))) {
        ctx.addIssue({ code: "custom", path: ["digestTimeSlots"], message: t("timeSlot") });
      }
      const isDaysValid = (days: string[]) =>
        days.every((item) => ALERT_DAY_PATTERN.test(item) && Number(item) <= 365);
      if (!isDaysValid(value.warrantyAlertDays)) {
        ctx.addIssue({ code: "custom", path: ["warrantyAlertDays"], message: t("alertDay") });
      }
      if (!isDaysValid(value.subscriptionDefaultAlertDays)) {
        ctx.addIssue({
          code: "custom",
          path: ["subscriptionDefaultAlertDays"],
          message: t("alertDay"),
        });
      }
    });
}

export type WorkspaceSettingFormValues = z.infer<ReturnType<typeof workspaceSettingSchema>>;
