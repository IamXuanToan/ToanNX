"use client";

import { type KeyboardEvent, useState } from "react";

/**
 * Kết quả kiểm tra và chuẩn hoá một phần tử sắp thêm vào danh sách chip.
 */
export interface ChipItemParseResult {
  /** Giá trị đã chuẩn hoá nếu hợp lệ. */
  value?: string;
  /** Thông báo lỗi hiển thị nếu không hợp lệ. */
  error?: string;
}

/**
 * Hook quản lý trạng thái nhập/thêm/xoá cho `ChipListInput` (khung giờ HH:MM, mốc ngày…).
 *
 * @param params - Danh sách hiện tại, callback cập nhật, hàm chuẩn hoá và sắp xếp tuỳ chọn.
 * @returns State và handler cho input thêm chip.
 */
export function useChipListInput({
  values,
  onChange,
  parseItem,
  sortItems,
}: {
  values: readonly string[];
  onChange: (next: string[]) => void;
  parseItem?: (raw: string) => ChipItemParseResult;
  sortItems?: (items: string[]) => string[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const addDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("");
      return;
    }

    const parsed = parseItem ? parseItem(trimmed) : { value: trimmed };
    if (parsed.error || !parsed.value) {
      setError(parsed.error ?? "");
      return;
    }

    const normalized = parsed.value;
    setError("");
    setDraft("");

    if (values.includes(normalized)) return;
    const next = [...values, normalized];
    onChange(sortItems ? sortItems(next) : next);
  };

  const removeItem = (target: string) => {
    setError("");
    onChange(values.filter((item) => item !== target));
  };

  const handleDraftChange = (next: string) => {
    setDraft(next);
    if (error) setError("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      addDraft();
    }
  };

  return {
    draft,
    error,
    setDraft: handleDraftChange,
    addDraft,
    removeItem,
    handleKeyDown,
  };
}
