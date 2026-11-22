"use client";

import { useMutation } from "@tanstack/react-query";

import { classificationRuleService } from "../services/classification-rule.service";

/** @returns Mutation thử nội dung với regex hoặc mọi quy tắc của mình. */
export function useRuleTest() {
  return useMutation({
    mutationFn: ({ content, pattern }: { content: string; pattern?: string }) =>
      classificationRuleService.test(content, pattern),
  });
}
