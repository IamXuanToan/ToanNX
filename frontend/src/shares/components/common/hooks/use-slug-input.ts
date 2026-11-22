"use client";

import { useRef, useState } from "react";

import { type SanitizeSlugOptions, sanitizeSlugInput } from "@/shares/lib/code-slug-input";

/** Giữ bản đang gõ để bộ gõ tiếng Việt hoàn tất trước khi chuẩn hóa giá trị form. */
export function useSlugInput(
  value: string,
  onChange: (value: string) => void,
  options?: SanitizeSlugOptions,
) {
  const [draft, setDraft] = useState<string | null>(null);
  const composing = useRef(false);
  const sanitize = (val: string) => sanitizeSlugInput(val, options);
  return {
    display: draft ?? value,
    change: (next: string) => {
      setDraft(next);
      if (!composing.current) onChange(sanitize(next));
    },
    startComposition: () => {
      composing.current = true;
    },
    endComposition: (next: string) => {
      composing.current = false;
      setDraft(next);
      onChange(sanitize(next));
    },
    blur: () => {
      onChange(sanitize(draft ?? value));
      setDraft(null);
    },
  };
}
