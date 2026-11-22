"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";
import type { PageInput } from "../types/page.types";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/**
 * Mutation tạo trang mới.
 *
 * @returns Mutation tạo trang.
 */
export function useCreatePage() {
  return useResourceMutation({
    mutationFn: (input: PageInput) => pageService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
