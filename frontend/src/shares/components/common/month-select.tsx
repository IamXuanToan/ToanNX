"use client";

import { useTranslations } from "next-intl";

import { SelectField } from "./select-field";

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * Chuẩn hoá giá trị tháng (1–12).
 *
 * @param value - Giá trị bất kỳ.
 * @returns Tháng dạng chuỗi, hoặc `undefined` khi không hợp lệ.
 */
export function normalizeMonthValue(value: unknown): string | undefined {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? String(month) : undefined;
}

/**
 * Chọn tháng chuẩn: lớp mỏng trên `SelectField`, nhãn tháng
 * theo ngôn ngữ. Giá trị là số 1–12. Điều khiển (controlled).
 *
 * @param props - Giá trị, callback và trạng thái.
 * @returns Ô chọn tháng.
 */
export function MonthSelect({
  id,
  value,
  onChange,
  disabled,
  invalid,
  placeholder,
  className,
}: {
  id?: string;
  value?: unknown;
  onChange: (value: number) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("common.monthSelect");
  return (
    <SelectField
      id={id}
      value={normalizeMonthValue(value)}
      onValueChange={(next) => onChange(Number(next))}
      options={MONTHS.map((month) => ({ value: String(month), label: t("month", { month }) }))}
      searchable={false}
      disabled={disabled}
      invalid={invalid}
      placeholder={placeholder ?? t("placeholder")}
      className={className}
    />
  );
}
