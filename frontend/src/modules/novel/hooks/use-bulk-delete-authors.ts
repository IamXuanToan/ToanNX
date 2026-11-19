/**
 * Mutation xóa hàng loạt tác giả.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { authorService } from "../services/author.service";

const INVALIDATE = [novelKeys.author.all, novelKeys.novel.all];

/**
 * Hook mutation xóa hàng loạt tác giả.
 *
 * @returns Mutation xóa nhiều tác giả.
 */
export function useBulkDeleteAuthors() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => authorService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
