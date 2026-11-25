import { z } from "zod";

import { CURRENCY_CODES, type MoneyCurrency } from "@/shares/constants/currency";

import { sanitizeSlugInput, SLUG_INPUT_MAX_LENGTH, SLUG_VALUE_REGEX } from "./code-slug-input";
/** Schema email chung; thông báo do namespace i18n của form cung cấp. */
export function emailField(invalid: string, required?: string) {
  const text = z.string().trim();
  return (required ? text.min(1, required) : text).pipe(z.email(invalid));
}
/** Schema mật khẩu chung; không trim hoặc biến đổi nội dung mật khẩu. */
export function passwordField(minimum: number, message: string) {
  return z.string().min(minimum, message);
}
/** Schema slug chung: thư viện xử lý Unicode trước khi áp hợp đồng URL của backend. */
export function slugField(
  message: string,
  { required = true, preserveCase = false }: { required?: boolean; preserveCase?: boolean } = {},
) {
  return z
    .string()
    .transform((val) => sanitizeSlugInput(val, { preserveCase }))
    .refine(
      (value) =>
        (!required && value === "") ||
        (value.length >= 3 &&
          value.length <= SLUG_INPUT_MAX_LENGTH &&
          SLUG_VALUE_REGEX.test(value)),
      { message },
    );
}
/** Tiền không âm: VND nguyên, USD tối đa hai số lẻ, giới hạn trong vùng số an toàn JS. */
export function moneyField(currency: MoneyCurrency, message: string) {
  return z
    .number({ error: message })
    .nonnegative(message)
    .max(Number.MAX_SAFE_INTEGER, message)
    .refine(
      (value) =>
        currency === CURRENCY_CODES.VND
          ? Number.isInteger(value)
          : Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
      { message },
    );
}
