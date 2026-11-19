/**
 * Mutation cập nhật thể loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { genreService } from "../services/genre.service";
import type { GenreUpdateInput } from "../types/genre.types";

const INVALIDATE = [novelKeys.genre.all, novelKeys.novel.all];

/**
 * Hook mutation cập nhật thông tin thể loại.
 *
 * @param id - UUID thể loại.
 * @returns Mutation cập nhật thể loại.
 */
export function useUpdateGenre(id: string) {
  return useResourceMutation({
    mutationFn: (input: GenreUpdateInput) => genreService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
