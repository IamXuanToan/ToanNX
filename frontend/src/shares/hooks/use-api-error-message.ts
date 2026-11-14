"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { isApiError } from "@/shares/lib/api/api-error";

/**
 * Trả về hàm dịch lỗi API theo mã lỗi ổn định; thiếu bản dịch thì dùng thông báo chung.
 *
 * @returns Hàm (error) => thông báo đã dịch.
 */
export function useApiErrorMessage() {
  const t = useTranslations("errors.codes");
  type ErrorCodeKey = Parameters<typeof t>[0];
  return useCallback(
    (error: unknown): string => {
      // Mã lỗi đến từ server nên chỉ biết lúc chạy; `t.has` kiểm tra trước khi dịch.
      const code = (isApiError(error) ? error.code : "UNKNOWN") as ErrorCodeKey;
      return t.has(code) ? t(code) : t("UNKNOWN");
    },
    [t],
  );
}
