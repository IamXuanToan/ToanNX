"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";
import type { PageInput } from "../types/page.types";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/**
 * Mutation cập nhật trang.
 *
 * @param id - Id trang.
 * @returns Mutation cập nhật trang.
 */
export function useUpdatePage(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<PageInput>) => pageService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
