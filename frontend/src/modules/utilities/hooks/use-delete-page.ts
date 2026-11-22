"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/**
 * Mutation xóa mềm một trang.
 *
 * @returns Mutation xóa trang.
 */
export function useDeletePage() {
  return useResourceMutation({
    mutationFn: (id: string) => pageService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
