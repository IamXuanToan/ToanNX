"use client";

import { type ClipboardEvent, type KeyboardEvent, useState } from "react";

/**
 * Tách chuỗi người dùng gõ/dán thành các thẻ (phân cách bằng dấu phẩy hoặc xuống dòng).
 *
 * @param raw - Chuỗi gốc.
 * @returns Danh sách thẻ đã trim, bỏ rỗng.
 */
export function splitTags(raw: string): string[] {
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Thêm thẻ vào danh sách, bỏ trùng không phân biệt hoa thường, giữ thứ tự.
 *
 * @param current - Danh sách hiện tại.
 * @param items - Thẻ mới.
 * @returns Danh sách mới.
 */
export function mergeTags(current: string[], items: string[]): string[] {
  const seen = new Set(current.map((item) => item.toLowerCase()));
  const next = [...current];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

/**
 * Hook quản lý trạng thái soạn thảo thẻ tạm, thêm/xóa thẻ, phím tắt và paste của TagsInput.
 *
 * @param value - Danh sách thẻ hiện tại.
 * @param onChange - Callback khi danh sách thẻ thay đổi.
 * @returns Draft hiện tại, hàm setDraft, removeTag và các event handler cho input.
 */
export function useTagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const items = splitTags(raw);
    if (items.length) onChange(mergeTags(value, items));
    setDraft("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((item) => item !== tagToRemove));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (!/[\n,]/.test(text)) return;
    event.preventDefault();
    commit(text);
  };

  const handleBlur = () => {
    if (draft.trim()) commit(draft);
  };

  return {
    draft,
    setDraft,
    removeTag,
    handleKeyDown,
    handlePaste,
    handleBlur,
  };
}
