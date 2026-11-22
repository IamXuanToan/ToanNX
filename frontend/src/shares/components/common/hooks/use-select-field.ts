"use client";

import { type KeyboardEvent, useId, useMemo, useState } from "react";

import { filterOptionsByKeyword } from "@/shares/lib/search-text";

import type { SelectOption } from "../select-field";

/** Từ ngưỡng này trở lên, `SelectField` tự dùng dạng có ô tìm. */
export const SEARCHABLE_THRESHOLD = 8;

/**
 * State của select có ô tìm: mở/đóng, từ khóa, danh sách đã lọc, mục đang trỏ bằng bàn phím.
 *
 * @param options - Danh sách lựa chọn.
 * @param onValueChange - Gọi khi chọn một mục.
 * @returns State và handler cho popover.
 */
export function useSelectField(options: SelectOption[], onValueChange: (value: string) => void) {
  const listId = useId();
  const [open, setOpenState] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => filterOptionsByKeyword(options, keyword), [options, keyword]);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next) {
      setKeyword("");
      setActiveIndex(0);
    }
  };

  const select = (value: string) => {
    onValueChange(value);
    setOpen(false);
  };

  const onKeywordChange = (value: string) => {
    setKeyword(value);
    setActiveIndex(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option && !option.disabled) select(option.value);
    }
  };

  return {
    listId,
    open,
    setOpen,
    keyword,
    onKeywordChange,
    filtered,
    activeIndex,
    setActiveIndex,
    select,
    onKeyDown,
  };
}
