"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/**
 * Mutation nhân bản trang.
 *
 * @returns Mutation nhân bản trang.
 */
export function useDuplicatePage() {
  return useResourceMutation({
    mutationFn: (id: string) => pageService.duplicate(id),
    invalidate: INVALIDATE,
  });
}
