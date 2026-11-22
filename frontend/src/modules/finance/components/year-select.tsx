"use client";

import { useTranslations } from "next-intl";

import { SelectField } from "@/shares/components/common/select-field";

/** @param props - Năm đang chọn, các năm, đổi năm. @returns Ô chọn năm. */
export function YearSelect({
  value,
  years,
  onChange,
}: {
  value: number;
  years: number[];
  onChange: (year: number) => void;
}) {
  const t = useTranslations("finance.report");
  return (
    <SelectField
      className="w-32"
      aria-label={t("year")}
      options={years.map((year) => ({ value: String(year), label: String(year) }))}
      value={String(value)}
      onValueChange={(year) => onChange(Number(year))}
    />
  );
}
