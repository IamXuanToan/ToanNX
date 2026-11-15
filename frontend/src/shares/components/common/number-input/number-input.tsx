"use client";
import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/shares/components/ui/input";
export type NumberInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode" | "min" | "max" | "step"
> & {
  value?: number | string | null;
  onChange?: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
};
/** Input số chuẩn dùng thư viện để giữ caret/paste; min/max áp lúc blur, schema form vẫn kiểm dữ liệu. */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  integer = false,
  placeholder,
  className,
  ref,
  onBlur,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const t = useTranslations("common.numberInput");
  return (
    <NumericFormat
      {...props}
      getInputRef={ref}
      customInput={Input}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      value={value ?? ""}
      valueIsNumericString
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={integer ? 0 : undefined}
      allowNegative={min === undefined || min < 0}
      placeholder={placeholder ?? (integer ? t("placeholderInteger") : t("placeholder"))}
      className={cn("tabular-nums", className)}
      onValueChange={(values, source) => {
        if (source.source === "event") onChange?.(values.floatValue ?? "");
      }}
      onBlur={(event) => {
        if (value !== null && value !== undefined && value !== "") {
          const number = Number(value);
          if (Number.isFinite(number)) {
            const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, number));
            if (next !== number) onChange?.(next);
          }
        }
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const number = Number(value || 0) + (event.key === "ArrowUp" ? step : -step);
        onChange?.(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, number)));
      }}
    />
  );
}
