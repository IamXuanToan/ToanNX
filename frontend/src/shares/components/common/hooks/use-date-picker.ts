"use client";

import { type SyntheticEvent, useId, useState } from "react";

import { formatIsoDate, parseIsoDate } from "@/shares/lib/date-time-input";

/**
 * Hook quản lý trạng thái popover, parse ngày ISO và các thao tác chọn/xóa ngày của DatePicker.
 *
 * @param value - Chuỗi ngày ISO yyyy-MM-dd hoặc null/rỗng.
 * @param onChange - Callback khi chọn hoặc xóa ngày.
 * @returns Trạng thái mở, calendarId, đối tượng Date đã parse, năm hiện tại và các hàm handler.
 */
export function useDatePicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const calendarId = useId();
  const selected = parseIsoDate(value);
  const year = new Date().getFullYear();

  const select = (date?: Date) => {
    onChange(formatIsoDate(date));
    setOpen(false);
  };

  const clear = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
  };

  return {
    open,
    setOpen,
    calendarId,
    selected,
    year,
    select,
    clear,
  };
}
