import { z } from "zod";

type Translate = (key: "required" | "positive") => string;

/** @param t - Hàm dịch `system.exchangeRates.validation`. @returns Schema form tỷ giá nhập tay. */
export function exchangeRateSchema(t: Translate) {
  return z.object({
    currencyId: z.string().min(1, t("required")),
    rateDate: z.string().min(1, t("required")),
    rate: z.string().regex(/^\d+(\.\d+)?$/, t("positive")),
    note: z.string().max(500),
  });
}

export type ExchangeRateFormValues = z.infer<ReturnType<typeof exchangeRateSchema>>;
