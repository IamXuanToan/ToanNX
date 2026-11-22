/**
 * Mutation xóa hàng loạt thẻ phân loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";

const INVALIDATE = [novelKeys.tag.all, novelKeys.novel.all];

/**
 * Hook mutation xóa hàng loạt thẻ.
 *
 * @returns Mutation xóa nhiều thẻ.
 */
export function useBulkDeleteTags() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => tagService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
