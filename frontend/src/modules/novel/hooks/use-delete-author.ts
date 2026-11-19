/**
 * Mutation xóa một tác giả.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";

const INVALIDATE = [novelKeys.author.all, novelKeys.novel.all];

/**
 * Hook mutation xóa tác giả.
 *
 * @returns Mutation xóa tác giả.
 */
export function useDeleteAuthor() {
  return useResourceMutation({
    mutationFn: (id: string) => authorService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
