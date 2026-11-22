import { z } from "zod";

type Translate = (key: "required" | "code") => string;

/** @param t - Hàm dịch `system.currencies.validation`. @returns Schema form tiền tệ. */
export function currencySchema(t: Translate) {
  return z.object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/, t("code")),
    name: z.string().trim().min(1, t("required")).max(100),
    symbol: z.string().trim().min(1, t("required")).max(10),
    decimalPlaces: z.string().regex(/^[0-4]$/, t("required")),
    isActive: z.boolean(),
    position: z.string().regex(/^\d+$/, t("required")),
  });
}

export type CurrencyFormValues = z.infer<ReturnType<typeof currencySchema>>;
