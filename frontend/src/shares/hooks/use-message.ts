"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import type { MessageKey } from "@/shares/types/navigation.types";

/**
 * Dịch khóa đầy đủ do module khai (`system.account.nav.users`) — dùng khi khóa đến từ cấu hình module
 * (điều hướng, nhãn field), không biết trước lúc viết code.
 *
 * @returns Hàm `(key) => chuỗi`; khóa không tồn tại thì trả lại chính khóa.
 */
export function useMessage() {
  const t = useTranslations();
  return useCallback(
    (key: MessageKey): string => (t.has(key as never) ? t(key as never) : key),
    [t],
  );
}
