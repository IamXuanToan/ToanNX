"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";
import type { ShortLinkInput } from "../types/short-link.types";

const INVALIDATE = [shortLinkKeys.all];

/**
 * Mutation tạo liên kết rút gọn mới.
 *
 * @returns Mutation tạo link rút gọn.
 */
export function useCreateShortLink() {
  return useResourceMutation({
    mutationFn: (input: ShortLinkInput) => shortLinkService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
