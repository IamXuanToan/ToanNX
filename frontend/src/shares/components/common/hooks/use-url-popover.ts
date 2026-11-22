"use client";

import { type FormEvent, useState } from "react";

/**
 * Hook quản lý trạng thái popover nhập URL (liên kết, ảnh, video) trong Tiptap toolbar.
 *
 * @param initial - Giá trị URL ban đầu khi mở popover.
 * @param onApply - Callback xác thực và áp dụng URL, trả về true nếu thành công.
 * @param onOpen - Callback khi mở popover để xóa lỗi cũ.
 * @returns Trạng thái mở, giá trị URL đang nhập, các hàm handler mở/đổi giá trị/submit form.
 */
export function useUrlPopover({
  initial = "",
  onApply,
  onOpen,
}: {
  initial?: string;
  onApply: (value: string) => boolean;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setValue(initial);
      onOpen();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (onApply(value.trim())) {
      setOpen(false);
    }
  };

  return {
    open,
    value,
    setValue,
    handleOpenChange,
    handleSubmit,
  };
}
