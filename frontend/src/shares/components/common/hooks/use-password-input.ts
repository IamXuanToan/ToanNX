"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Hook quản lý trạng thái ẩn/hiện mật khẩu trong PasswordInput.
 *
 * @returns Cờ visible, hàm toggle và nhãn aria-label tương ứng.
 */
export function usePasswordInput() {
  const t = useTranslations("common.password");
  const [visible, setVisible] = useState(false);
  const label = visible ? t("hide") : t("show");

  const toggle = () => {
    setVisible((value) => !value);
  };

  return {
    visible,
    toggle,
    label,
  };
}
