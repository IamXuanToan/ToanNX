"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook quản lý việc tự động cuộn mục đang chọn vào vị trí giữa trong cột giờ/phút của TimePickerPopover.
 *
 * @param open - Trạng thái mở của popover.
 * @param value - Giá trị giờ hoặc phút hiện tại.
 * @returns Ref cho khung cuộn (viewportRef) và ref cho nút được chọn (selectedRef).
 */
export function useTimeScrollColumn(open: boolean, value: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      const viewport = viewportRef.current;
      const selected = selectedRef.current;
      if (!viewport || !selected) return;
      viewport.scrollTop =
        selected.offsetTop - viewport.clientHeight / 2 + selected.clientHeight / 2;
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open, value]);

  return {
    viewportRef,
    selectedRef,
  };
}

/**
 * Hook quản lý trạng thái popover và định dạng chuỗi hiển thị HH:MM của TimePickerPopover.
 *
 * @param hour - Giá trị giờ (0-23).
 * @param minute - Giá trị phút (0-59).
 * @returns Trạng thái mở, hàm setOpen và chuỗi định dạng display.
 */
export function useTimePickerPopover(hour: number, minute: number) {
  const [open, setOpen] = useState(false);
  const display = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    open,
    setOpen,
    display,
  };
}
