"use client";

import { useState } from "react";

/** Giữ bản đang gõ tách khỏi từ khóa đã áp dụng; chỉ tìm khi Enter hoặc bấm xóa. */
export function useSearchInput(value: string, onValueChange: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);

  if (previousValue !== value) {
    setPreviousValue(value);
    setDraft(value);
  }

  const submit = () => {
    const keyword = draft.trim();
    setDraft(keyword);
    onValueChange(keyword);
  };

  const clear = () => {
    setDraft("");
    onValueChange("");
  };

  return { draft, setDraft, submit, clear };
}
