"use client";

import { useRef, useState } from "react";

import { sanitizeSlugInput } from "@/shares/lib/code-slug-input";

/** Giữ bản đang gõ để bộ gõ tiếng Việt hoàn tất trước khi chuẩn hóa giá trị form. */
export function useSlugInput(value: string, onChange: (value: string) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  const composing = useRef(false);
  return {
    display: draft ?? value,
    change: (next: string) => {
      setDraft(next);
      if (!composing.current) onChange(sanitizeSlugInput(next));
    },
    startComposition: () => {
      composing.current = true;
    },
    endComposition: (next: string) => {
      composing.current = false;
      setDraft(next);
      onChange(sanitizeSlugInput(next));
    },
    blur: () => {
      onChange(sanitizeSlugInput(draft ?? value));
      setDraft(null);
    },
  };
}
