import { z } from "zod";

type Translate = (key: "positive") => string;

const POSITIVE_AMOUNT = /^(?!0+(\.0+)?$)\d+(\.\d+)?$/;

/** Tên trường form Gia hạn dịch vụ. */
export const SUBSCRIPTION_RENEW_FORM_FIELDS = [
  "paidOn",
  "amount",
  "exchangeRate",
  "paymentMethod",
  "receiptAttachmentId",
  "note",
  "advanceFrom",
] as const;

/**
 * Schema modal Gia hạn dịch vụ định kỳ.
 *
 * @param t - Hàm dịch `workspace.validation`.
 * @returns Zod schema.
 */
export function subscriptionRenewSchema(t: Translate) {
  return z
    .object({
      paidOn: z.string(),
      amount: z.string().trim(),
      exchangeRate: z.string().trim(),
      paymentMethod: z.string().trim().max(120),
      receiptAttachmentId: z.string(),
      note: z.string().max(1000),
      advanceFrom: z.enum(["cycle", "today"]),
    })
    .superRefine((value, ctx) => {
      if (value.amount && !POSITIVE_AMOUNT.test(value.amount)) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: t("positive") });
      }
      if (value.exchangeRate && !POSITIVE_AMOUNT.test(value.exchangeRate)) {
        ctx.addIssue({ code: "custom", path: ["exchangeRate"], message: t("positive") });
      }
    });
}

export type SubscriptionRenewFormValues = z.infer<ReturnType<typeof subscriptionRenewSchema>>;
