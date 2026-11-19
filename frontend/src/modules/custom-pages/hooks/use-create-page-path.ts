"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";
import type { PagePathInput } from "../types/page-path.types";

const INVALIDATE = [pagePathKeys.all, pageKeys.all];

/**
 * Mutation tạo đường dẫn giữa mới.
 *
 * @returns Mutation tạo đường dẫn giữa.
 */
export function useCreatePagePath() {
  return useResourceMutation({
    mutationFn: (input: PagePathInput) => pagePathService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
