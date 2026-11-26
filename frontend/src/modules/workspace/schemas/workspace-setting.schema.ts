import { z } from "zod";

import { TELEGRAM_GROUP_TOOL_POLICIES } from "../constants/defaults";

type Translate = (key: "required" | "timeSlot" | "positiveInt" | "daysList") => string;

const HHMM_SLOT = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Tên trường form Cài đặt Trợ lý & Digest. */
export const WORKSPACE_SETTING_FORM_FIELDS = [
  "timezone",
  "dailyDigestEnabled",
  "digestTimeSlots",
  "digestSections",
  "warrantyAlertDays",
  "subscriptionDefaultAlertDays",
  "preferredAiModel",
  "aiDailyTokenLimit",
  "telegramAiEnabled",
  "telegramAllowedChatIds",
  "telegramGroupRequireMention",
  "telegramGroupToolPolicy",
  "telegramGroupHideAmounts",
  "telegramGroupReplyInDm",
] as const;

/**
 * Schema form Cài đặt Trợ lý AI, Digest & Telegram hai chiều.
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
      warrantyAlertDaysText: z.string().trim(),
      subscriptionDefaultAlertDaysText: z.string().trim(),
      preferredAiModel: z.string().trim().max(120),
      aiDailyTokenLimit: z.string().trim(),
      telegramAiEnabled: z.boolean(),
      telegramAllowedChatIds: z.array(z.string()),
      telegramGroupRequireMention: z.boolean(),
      telegramGroupToolPolicy: z.enum(TELEGRAM_GROUP_TOOL_POLICIES),
      telegramGroupHideAmounts: z.boolean(),
      telegramGroupReplyInDm: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (value.digestTimeSlots.some((slot) => !HHMM_SLOT.test(slot))) {
        ctx.addIssue({ code: "custom", path: ["digestTimeSlots"], message: t("timeSlot") });
      }
      if (
        value.aiDailyTokenLimit &&
        (!/^\d+$/.test(value.aiDailyTokenLimit) || Number(value.aiDailyTokenLimit) < 100)
      ) {
        ctx.addIssue({ code: "custom", path: ["aiDailyTokenLimit"], message: t("positiveInt") });
      }
      const isDaysCsvValid = (raw: string) =>
        !raw ||
        raw
          .split(",")
          .map((item) => item.trim())
          .every((item) => /^\d+$/.test(item) && Number(item) <= 365);
      if (!isDaysCsvValid(value.warrantyAlertDaysText)) {
        ctx.addIssue({ code: "custom", path: ["warrantyAlertDaysText"], message: t("daysList") });
      }
      if (!isDaysCsvValid(value.subscriptionDefaultAlertDaysText)) {
        ctx.addIssue({
          code: "custom",
          path: ["subscriptionDefaultAlertDaysText"],
          message: t("daysList"),
        });
      }
    });
}

export type WorkspaceSettingFormValues = z.infer<ReturnType<typeof workspaceSettingSchema>>;
