"use client";

import { useMemo, useState } from "react";

import { normalizeSearchText } from "@/shares/lib/search-text";

import type { ChoiceItem } from "../types";

/** Từ số mục này trở lên thì `ChoiceList` có ô tìm (giống `SelectField`, `FilterSelect`). */
export const CHOICE_SEARCHABLE_THRESHOLD = 8;

/**
 * Lọc mục của `ChoiceList` theo từ khoá gõ (lọc ngay, không phân biệt dấu/hoa thường) trên nhãn, mã, mô tả.
 *
 * @param items - Mục.
 * @returns Từ khoá, hàm đổi và mục đã lọc.
 */
export function useChoiceList(items: ChoiceItem[]) {
  const [keyword, setKeyword] = useState("");
  const filtered = useMemo(() => {
    const needle = normalizeSearchText(keyword.trim());
    if (!needle) return items;
    return items.filter((item) =>
      normalizeSearchText(`${item.label} ${item.code ?? ""} ${item.description ?? ""}`).includes(
        needle,
      ),
    );
  }, [items, keyword]);
  return { keyword, setKeyword, filtered };
}
