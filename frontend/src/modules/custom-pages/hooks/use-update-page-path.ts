"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";
import type { PagePathInput } from "../types/page-path.types";

const INVALIDATE = [pagePathKeys.all, pageKeys.all];

/**
 * Mutation sửa thông tin đường dẫn giữa.
 *
 * @param id - Id đường dẫn giữa.
 * @returns Mutation cập nhật đường dẫn giữa.
 */
export function useUpdatePagePath(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<PagePathInput>) => pagePathService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
