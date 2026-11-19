/**
 * Mutation cập nhật tác giả.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";
import type { AuthorUpdateInput } from "../types/author.types";

const INVALIDATE = [novelKeys.author.all, novelKeys.novel.all];

/**
 * Hook mutation cập nhật thông tin tác giả.
 *
 * @param id - UUID tác giả.
 * @returns Mutation cập nhật tác giả.
 */
export function useUpdateAuthor(id: string) {
  return useResourceMutation({
    mutationFn: (input: AuthorUpdateInput) => authorService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
