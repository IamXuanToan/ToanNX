"use client";

import { useState } from "react";

import { isSearchQueryTooLong } from "@/shares/lib/search-text";

/** Giữ bản đang gõ tách khỏi từ khóa đã áp dụng; kiểm giới hạn trước khi gửi khi nhấn Enter hoặc bấm xóa. */
export function useSearchInput(value: string, onValueChange: (value: string) => void) {
  const [draft, setDraftState] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [hasError, setHasError] = useState(false);

  if (previousValue !== value) {
    setPreviousValue(value);
    setDraftState(value);
    setHasError(false);
  }

  const setDraft = (next: string) => {
    setDraftState(next);
    if (hasError && !isSearchQueryTooLong(next)) {
      setHasError(false);
    }
  };

  const submit = () => {
    const keyword = draft.trim();
    if (isSearchQueryTooLong(keyword)) {
      setHasError(true);
      return;
    }
    setHasError(false);
    setDraftState(keyword);
    onValueChange(keyword);
  };

  const clear = () => {
    setHasError(false);
    setDraftState("");
    onValueChange("");
  };

  return { draft, setDraft, submit, clear, hasError };
}
