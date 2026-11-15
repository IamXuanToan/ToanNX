"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { Input } from "@/shares/components/ui/input";
import { CODE_INPUT_MAX_LENGTH, sanitizeCodeInput } from "@/shares/lib/code-slug-input";

/**
 * Ô nhập mã chuẩn (mã vai trò, mã danh mục…): chỉ chữ, số, `.`, `_`, `-`, bắt đầu bằng chữ/số;
 * `uppercase` để tự viết hoa. Điều khiển (controlled): dùng với `Controller`; validate bằng schema nghiệp vụ
 * hoặc regex riêng của module.
 *
 * @param props - Giá trị, callback, `uppercase` và prop còn lại của `<input>`.
 * @returns Ô nhập mã.
 */
export function CodeInput({
  value,
  onChange,
  uppercase,
  className,
  placeholder,
  maxLength = CODE_INPUT_MAX_LENGTH,
  ...props
}: Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  uppercase?: boolean;
}) {
  const t = useTranslations("common.codeInput");
  return (
    <Input
      {...props}
      type="text"
      value={value}
      maxLength={maxLength}
      autoComplete="off"
      autoCapitalize={uppercase ? "characters" : "none"}
      spellCheck={false}
      placeholder={placeholder ?? t("placeholder")}
      className={cn("font-mono", uppercase && "uppercase", className)}
      onChange={(event) => onChange(sanitizeCodeInput(event.target.value, { uppercase }))}
    />
  );
}
