import { z } from "zod";

import {
  ASSISTANT_LAUNCHER_SIZE_OPTIONS,
  TELEGRAM_GROUP_TOOL_POLICIES,
} from "../constants/defaults";

type Translate = (key: "positiveInt" | "timeSlot" | "alertDay") => string;

/** Tên trường form Cấu hình Chatbot AI dùng chung trên màn Admin. */
export const ASSISTANT_CONFIG_FORM_FIELDS = [
  "assistantName",
  "assistantAvatarId",
  "launcherSize",
  "assistantSystemPrompt",
  "preferredAiModel",
  "aiDailyTokenLimit",
  "telegramAiEnabled",
  "telegramGroupRequireMention",
  "telegramGroupToolPolicy",
  "telegramGroupHideAmounts",
  "telegramGroupReplyInDm",
  "digestTimeSlots",
  "digestSections",
  "warrantyAlertDays",
  "subscriptionDefaultAlertDays",
] as const;

/**
 * Schema form Cấu hình Chatbot AI dùng chung (Admin).
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function assistantConfigSchema(t: Translate) {
  return z
    .object({
      assistantName: z.string().trim().max(80),
      assistantAvatarId: z.string().nullable(),
      launcherSize: z.enum(ASSISTANT_LAUNCHER_SIZE_OPTIONS),
      assistantSystemPrompt: z.string().trim().max(2000),
      preferredAiModel: z.string().trim().max(120),
      aiDailyTokenLimit: z.string().trim(),
      telegramAiEnabled: z.boolean(),
      telegramGroupRequireMention: z.boolean(),
      telegramGroupToolPolicy: z.enum(TELEGRAM_GROUP_TOOL_POLICIES),
      telegramGroupHideAmounts: z.boolean(),
      telegramGroupReplyInDm: z.boolean(),
      digestTimeSlots: z.array(z.string()),
      digestSections: z.array(z.string()),
      warrantyAlertDays: z.array(z.string()),
      subscriptionDefaultAlertDays: z.array(z.string()),
    })
    .superRefine((value, ctx) => {
      if (
        value.aiDailyTokenLimit &&
        (!/^\d+$/.test(value.aiDailyTokenLimit) || Number(value.aiDailyTokenLimit) < 100)
      ) {
        ctx.addIssue({ code: "custom", path: ["aiDailyTokenLimit"], message: t("positiveInt") });
      }
    });
}

export type AssistantConfigFormValues = z.infer<ReturnType<typeof assistantConfigSchema>>;
