"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";
import { NumericFormat } from "react-number-format";

import { Input } from "@/shares/components/ui/input";
import { formatDisplayMoney } from "@/shares/lib/number-format";

export type MoneyCurrency = "VND" | "USD";
export const DEFAULT_CURRENCY: MoneyCurrency = "VND";

/** Props tiền tệ: giá trị thô, không chứa dấu phân cách hoặc ký hiệu tiền. */
export type MoneyInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"
> & {
  value?: number | string | null;
  onChange?: (value: number | "") => void;
  currency?: MoneyCurrency;
  viewMode?: boolean;
};

/** Ô nhập tiền dùng thư viện xử lý caret, paste và phần lẻ: VND nguyên, USD hai số lẻ. */
export function MoneyInput({
  value,
  onChange,
  currency = DEFAULT_CURRENCY,
  viewMode,
  className,
  ref,
  ...props
}: MoneyInputProps) {
  if (viewMode) {
    return (
      <div
        className={cn(
          "bg-muted/40 flex h-10 items-center rounded-xl border px-3 text-sm tabular-nums",
          className,
        )}
      >
        {value === null || value === undefined || value === ""
          ? "—"
          : formatDisplayMoney(value, { currency })}
      </div>
    );
  }
  return (
    <NumericFormat
      {...props}
      getInputRef={ref}
      customInput={Input}
      type="text"
      inputMode={currency === "VND" ? "numeric" : "decimal"}
      value={value ?? ""}
      valueIsNumericString
      thousandSeparator={currency === "VND" ? "." : ","}
      decimalSeparator={currency === "VND" ? "," : "."}
      decimalScale={currency === "VND" ? 0 : 2}
      allowNegative={false}
      suffix={` ${currency}`}
      className={cn("tabular-nums", className)}
      onValueChange={(values, source) => {
        if (source.source === "event") onChange?.(values.floatValue ?? "");
      }}
    />
  );
}
