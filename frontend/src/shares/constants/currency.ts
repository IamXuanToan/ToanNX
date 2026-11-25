/** Mã và ký hiệu tiền tệ dùng chung ở Frontend. */
export type MoneyCurrency = "VND" | "USD";

export const CURRENCY_CODES = {
  VND: "VND",
  USD: "USD",
} as const satisfies Record<MoneyCurrency, MoneyCurrency>;

export const CURRENCY_SYMBOLS = {
  VND: "₫",
  USD: "$",
} as const satisfies Record<MoneyCurrency, string>;

export const DEFAULT_CURRENCY: MoneyCurrency = CURRENCY_CODES.VND;
