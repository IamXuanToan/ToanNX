"use client";

import { useId, useMemo, useState } from "react";

import { filterOptionsByKeyword } from "@/shares/lib/search-text";

import type { SelectOption } from "../select-field";

/**
 * Hook quản lý trạng thái popover, lọc theo từ khóa và lựa chọn nhiều phần tử của MultiSelect.
 *
 * @param options - Danh sách các tùy chọn.
 * @param value - Mảng các giá trị đang được chọn.
 * @param onChange - Callback khi thay đổi mảng giá trị đã chọn.
 * @returns Trạng thái popover, keyword tìm kiếm, danh sách lọc, danh sách chọn và các handler.
 */
export function useMultiSelect({
  options,
  value,
  onChange,
}: {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => filterOptionsByKeyword(options, keyword), [options, keyword]);
  const selected = options.filter((option) => value.includes(option.value));

  const toggle = (next: string) =>
    onChange(value.includes(next) ? value.filter((item) => item !== next) : [...value, next]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setKeyword("");
  };

  const clearAll = () => {
    onChange([]);
  };

  return {
    listId,
    open,
    keyword,
    setKeyword,
    filtered,
    selected,
    toggle,
    handleOpenChange,
    clearAll,
  };
}
