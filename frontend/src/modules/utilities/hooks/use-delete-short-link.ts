"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";

const INVALIDATE = [shortLinkKeys.all];

/**
 * Mutation xóa mềm một liên kết rút gọn.
 *
 * @returns Mutation xóa link.
 */
export function useDeleteShortLink() {
  return useResourceMutation({
    mutationFn: (id: string) => shortLinkService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
