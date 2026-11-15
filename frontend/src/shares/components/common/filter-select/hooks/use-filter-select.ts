"use client";

import { useId, useMemo, useState } from "react";

import { filterOptionsByKeyword } from "@/shares/lib/search-text";

import type { SelectOption } from "../../select-field/select-field";

/** Từ số lựa chọn này trở lên thì bộ lọc có ô tìm (giống `SelectField`). */
export const FILTER_SEARCHABLE_THRESHOLD = 8;

/**
 * State của `FilterSelect`: mở/đóng, từ khoá tìm, bật/tắt từng giá trị, xoá lọc.
 * Thứ tự giá trị trả về theo thứ tự lựa chọn để URL ổn định.
 *
 * @param params - Lựa chọn, giá trị, callback và cờ tìm kiếm.
 * @returns State và handler.
 */
export function useFilterSelect({
  options,
  value,
  onValueChange,
  searchable,
}: {
  options: SelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  searchable?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  // Khi popover mở, lựa chọn giữ cục bộ: bấm liên tiếp nhiều ô không bị giá trị cũ (URL chưa kịp
  // cập nhật) ghi đè. Đóng popover thì lại hiện đúng `value` từ ngoài.
  const [draft, setDraft] = useState<string[] | null>(null);
  const current = open && draft ? draft : value;
  const isSearchable = searchable ?? options.length >= FILTER_SEARCHABLE_THRESHOLD;
  const filtered = useMemo(
    () => (isSearchable ? filterOptionsByKeyword(options, keyword) : options),
    [isSearchable, options, keyword],
  );
  const commit = (next: string[]) => {
    const ordered = options.map((option) => option.value).filter((v) => next.includes(v));
    setDraft(ordered);
    onValueChange(ordered);
  };

  return {
    listId,
    open,
    keyword,
    setKeyword,
    isSearchable,
    filtered,
    value: current,
    selected: options.filter((option) => current.includes(option.value)),
    onOpenChange: (next: boolean) => {
      setOpen(next);
      setDraft(next ? [...value] : null);
      if (!next) setKeyword("");
    },
    toggle: (item: string) =>
      commit(current.includes(item) ? current.filter((v) => v !== item) : [...current, item]),
    clear: () => commit([]),
    allSelected: options.length > 0 && options.every((option) => current.includes(option.value)),
    toggleAll: () =>
      commit(
        options.every((option) => current.includes(option.value))
          ? []
          : options.filter((option) => !option.disabled).map((option) => option.value),
      ),
  };
}
