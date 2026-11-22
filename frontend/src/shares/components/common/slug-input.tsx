"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { Input } from "@/shares/components/ui/input";
import { SLUG_INPUT_MAX_LENGTH } from "@/shares/lib/code-slug-input";
import { useSlugInput } from "./hooks/use-slug-input";

/**
 * Ô nhập slug URL chuẩn (Django SlugField): tự viết thường, khoảng trắng → `-`, bỏ ký tự lạ ngay khi gõ.
 * Điều khiển (controlled): dùng với `Controller` của react-hook-form; validate bằng common `slugField`.
 *
 * @param props - Giá trị, callback và prop còn lại của `<input>`.
 * @returns Ô nhập slug.
 */
export function SlugInput({
  value,
  onChange,
  className,
  placeholder,
  maxLength = SLUG_INPUT_MAX_LENGTH,
  preserveCase = false,
  onBlur,
  ...props
}: Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  preserveCase?: boolean;
}) {
  const t = useTranslations("common.slugInput");
  const input = useSlugInput(value, onChange, { preserveCase });
  return (
    <Input
      {...props}
      type="text"
      value={input.display}
      maxLength={maxLength}
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      placeholder={placeholder ?? t("placeholder")}
      className={cn("font-mono", className)}
      onChange={(event) => input.change(event.target.value)}
      onCompositionStart={input.startComposition}
      onCompositionEnd={(event) => input.endComposition(event.currentTarget.value)}
      onBlur={(event) => {
        input.blur();
        onBlur?.(event);
      }}
    />
  );
}
