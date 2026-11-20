"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";
import type { ShortLinkInput } from "../types/short-link.types";

const INVALIDATE = [shortLinkKeys.all];

/**
 * Mutation sửa thông tin liên kết rút gọn.
 *
 * @param id - Id link.
 * @returns Mutation sửa link.
 */
export function useUpdateShortLink(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<ShortLinkInput>) => shortLinkService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
