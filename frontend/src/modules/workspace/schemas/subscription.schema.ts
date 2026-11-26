import { z } from "zod";

import {
  BILLING_CYCLES,
  SUBSCRIPTION_CATEGORIES,
  WORKSPACE_NOTIFICATION_CHANNELS,
} from "../constants/defaults";

type Translate = (
  key: "required" | "positive" | "url" | "customDays" | "anchorDay" | "atLeastOneChannel",
) => string;

const POSITIVE_AMOUNT = /^(?!0+(\.0+)?$)\d+(\.\d+)?$/;
const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** Tên trường form Dịch vụ định kỳ. */
export const SUBSCRIPTION_FORM_FIELDS = [
  "name",
  "provider",
  "category",
  "billingCycle",
  "customCycleDays",
  "anchorDay",
  "amount",
  "currencyId",
  "exchangeRate",
  "renewDate",
  "autoRenew",
  "paymentMethod",
  "manageUrl",
  "reminderDaysBefore",
  "isActive",
  "notes",
  "notificationChannels",
] as const;

/**
 * Schema form Dịch vụ định kỳ.
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function subscriptionSchema(t: Translate) {
  return z
    .object({
      name: z.string().trim().min(1, t("required")).max(200),
      provider: z.string().trim().max(150),
      category: z.enum(SUBSCRIPTION_CATEGORIES),
      billingCycle: z.enum(BILLING_CYCLES),
      customCycleDays: z.string().trim(),
      anchorDay: z.string().trim(),
      amount: z.string().trim().regex(POSITIVE_AMOUNT, t("positive")),
      currencyId: z.string().min(1, t("required")),
      exchangeRate: z.string().trim(),
      renewDate: z.string().min(1, t("required")),
      autoRenew: z.boolean(),
      paymentMethod: z.string().trim().max(120),
      manageUrl: z.string().trim().max(500),
      reminderDaysBefore: z.array(z.number()),
      isActive: z.boolean(),
      notes: z.string().max(2000),
      notificationChannels: z
        .array(z.enum(WORKSPACE_NOTIFICATION_CHANNELS))
        .min(1, t("atLeastOneChannel")),
    })
    .superRefine((value, ctx) => {
      if (value.exchangeRate && !POSITIVE_AMOUNT.test(value.exchangeRate)) {
        ctx.addIssue({ code: "custom", path: ["exchangeRate"], message: t("positive") });
      }
      if (value.manageUrl && !HTTP_URL.test(value.manageUrl)) {
        ctx.addIssue({ code: "custom", path: ["manageUrl"], message: t("url") });
      }
      if (value.billingCycle === "CUSTOM_DAYS") {
        const days = Number(value.customCycleDays);
        if (!/^\d+$/.test(value.customCycleDays) || days < 1 || days > 3650) {
          ctx.addIssue({ code: "custom", path: ["customCycleDays"], message: t("customDays") });
        }
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

export type SubscriptionFormValues = z.infer<ReturnType<typeof subscriptionSchema>>;
