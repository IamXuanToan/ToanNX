/**
 * Mutation tạo mới tác giả.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";
import type { AuthorCreateInput } from "../types/author.types";

const INVALIDATE = [novelKeys.author.all, novelKeys.novel.all];

/**
 * Hook mutation tạo mới tác giả.
 *
 * @returns Mutation tạo tác giả.
 */
export function useCreateAuthor() {
  return useResourceMutation({
    mutationFn: (input: AuthorCreateInput) => authorService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
