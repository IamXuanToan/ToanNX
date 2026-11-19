/**
 * Mutation xóa một thể loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { genreService } from "../services/genre.service";

const INVALIDATE = [novelKeys.genre.all, novelKeys.novel.all];

/**
 * Hook mutation xóa thể loại.
 *
 * @returns Mutation xóa thể loại.
 */
export function useDeleteGenre() {
  return useResourceMutation({
    mutationFn: (id: string) => genreService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
