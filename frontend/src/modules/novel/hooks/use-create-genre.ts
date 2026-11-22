/**
 * Mutation tạo mới thể loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { genreService } from "../services/genre.service";
import type { GenreCreateInput } from "../types/genre.types";

const INVALIDATE = [novelKeys.genre.all, novelKeys.novel.all];

/**
 * Hook mutation tạo mới thể loại.
 *
 * @returns Mutation tạo thể loại.
 */
export function useCreateGenre() {
  return useResourceMutation({
    mutationFn: (input: GenreCreateInput) => genreService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
