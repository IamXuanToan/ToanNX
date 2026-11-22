"use client";

import { useState } from "react";

import { useRuleTest } from "../../hooks/use-rule-test";

/** @param pattern - Regex đang soạn (trống = chạy mọi quy tắc của mình). @returns Nội dung thử + kết quả. */
export function useRuleTester(pattern?: string) {
  const [content, setContent] = useState("");
  const test = useRuleTest();
  return {
    content,
    setContent,
    run: () => test.mutate({ content, pattern }),
    result: test.data,
    isRunning: test.isPending,
  };
}
