/**
 * Mutation xóa hàng loạt thể loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { genreService } from "../services/genre.service";

const INVALIDATE = [novelKeys.genre.all, novelKeys.novel.all];

/**
 * Hook mutation xóa hàng loạt thể loại.
 *
 * @returns Mutation xóa nhiều thể loại.
 */
export function useBulkDeleteGenres() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => genreService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
