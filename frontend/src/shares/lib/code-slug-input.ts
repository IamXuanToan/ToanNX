import slugify from "@sindresorhus/slugify";

/** Mã: bắt đầu bằng chữ/số; tiếp theo là chữ, số, `.`, `_`, `-` */
export const CODE_VALUE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const CODE_CHAR_FILTER_REGEX = /[^a-zA-Z0-9._-]/g;

/** Slug URL (Django SlugField): chữ cái, số, nối bằng dấu gạch ngang */
export const SLUG_VALUE_REGEX = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;

export const CODE_INPUT_MAX_LENGTH = 100;
export const SLUG_INPUT_MAX_LENGTH = 64;

export type SanitizeCodeOptions = {
  uppercase?: boolean;
};

export type SanitizeSlugOptions = {
  preserveCase?: boolean;
};

/**
 * Lọc ký tự không hợp lệ khỏi mã (chỉ giữ chữ, số, `.`, `_`, `-`; bắt đầu bằng chữ/số).
 *
 * @param value - Chuỗi người dùng gõ.
 * @param options - `uppercase` để viết hoa.
 * @returns Mã đã lọc.
 */
export function sanitizeCodeInput(value: string, options?: SanitizeCodeOptions): string {
  let next = value.replace(CODE_CHAR_FILTER_REGEX, "");
  if (next.length > 0 && !/^[a-zA-Z0-9]/.test(next)) {
    next = next.replace(/^[^a-zA-Z0-9]+/, "");
  }
  if (options?.uppercase) {
    next = next.toUpperCase();
  }
  return next;
}

/**
 * Chuẩn hoá slug ngay khi gõ: bỏ dấu tiếng Việt, khoảng trắng → `-`, bỏ ký tự lạ,
 * gộp `-` liên tiếp ("Bài Viết Mới" → `bai-viet-moi`, giữ hoa nếu `preserveCase`).
 *
 * @param value - Chuỗi người dùng gõ.
 * @param options - `preserveCase` để giữ nguyên chữ hoa chữ thường.
 * @returns Slug đã lọc.
 */
export function sanitizeSlugInput(value: string, options?: SanitizeSlugOptions): string {
  return slugify(value, {
    decamelize: false,
    lowercase: options?.preserveCase ? false : true,
  });
}

/**
 * Mã hợp lệ (rỗng coi là hợp lệ).
 *
 * @param value - Mã.
 * @returns True nếu hợp lệ.
 */
export function isValidCodeValue(value: string): boolean {
  return value === "" || CODE_VALUE_REGEX.test(value);
}

/**
 * Slug hợp lệ (rỗng coi là hợp lệ).
 *
 * @param value - Slug.
 * @returns True nếu hợp lệ.
 */
export function isValidSlugValue(value: string): boolean {
  return value === "" || SLUG_VALUE_REGEX.test(value);
}
