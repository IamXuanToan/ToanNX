/** Ngôn ngữ và múi giờ chuẩn toàn ứng dụng. */
export const DEFAULT_LOCALE_CODE = "vi" as const;
export const ENGLISH_LOCALE_CODE = "en" as const;
export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

/** Locale định dạng số/ngày theo chuẩn `Intl`. */
export const APP_NUMBER_LOCALE = "vi-VN";
export const EN_NUMBER_LOCALE = "en-US";
export const CHINESE_LUNAR_LOCALE = "vi-VN-u-ca-chinese";

/** Bản đồ từ mã ngôn ngữ app sang locale chuẩn `Intl`. */
export const NUMBER_LOCALE_BY_LOCALE = {
  [DEFAULT_LOCALE_CODE]: APP_NUMBER_LOCALE,
  [ENGLISH_LOCALE_CODE]: EN_NUMBER_LOCALE,
} as const;
