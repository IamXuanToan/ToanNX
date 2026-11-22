import { z } from "zod";

type Translate = (key: "required" | "positive") => string;

/** Tên trường form giao dịch có thể nhận lỗi từ BE. */
export const INCOME_FORM_FIELDS = [
  "receivedAt",
  "platformId",
  "currencyId",
  "originalAmount",
  "exchangeRate",
  "content",
  "note",
  "taxRate",
  "taxAmount",
] as const;

const NUMBER = /^\d+(\.\d+)?$/;

/** @param t - Hàm dịch `finance.validation`. @returns Schema form giao dịch (nhập tay/sửa). */
export function incomeSchema(t: Translate) {
  return z
    .object({
      receivedAt: z.string().min(1, t("required")),
      platformId: z.string(),
      currencyId: z.string().min(1, t("required")),
      originalAmount: z.string().regex(NUMBER, t("positive")),
      rateSource: z.enum(["API", "MANUAL"]),
      exchangeRate: z.string(),
      content: z.string().max(1000),
      note: z.string().max(2000),
      isTaxManual: z.boolean(),
      taxWithheld: z.boolean(),
      taxRate: z.string(),
      taxAmount: z.string(),
    })
    .superRefine((value, ctx) => {
      if (value.rateSource === "MANUAL" && !NUMBER.test(value.exchangeRate)) {
        ctx.addIssue({ code: "custom", path: ["exchangeRate"], message: t("positive") });
      }
      if (value.isTaxManual && value.taxWithheld && !NUMBER.test(value.taxRate)) {
        ctx.addIssue({ code: "custom", path: ["taxRate"], message: t("positive") });
      }
    });
}

export type IncomeFormValues = z.infer<ReturnType<typeof incomeSchema>>;
