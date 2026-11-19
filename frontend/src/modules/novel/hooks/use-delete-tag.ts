/**
 * Mutation xóa một thẻ phân loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";

const INVALIDATE = [novelKeys.tag.all, novelKeys.novel.all];

/**
 * Hook mutation xóa thẻ.
 *
 * @returns Mutation xóa thẻ.
 */
export function useDeleteTag() {
  return useResourceMutation({
    mutationFn: (id: string) => tagService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
