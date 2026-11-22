/**
 * Hook quản lý trạng thái bảng thể loại.
 */

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { NOVEL_ROUTES } from "../../../constants/routes";
import { useBulkDeleteGenres } from "../../../hooks/use-bulk-delete-genres";
import { useDeleteGenre } from "../../../hooks/use-delete-genre";
import { useGenres } from "../../../hooks/use-genres";
import type { Genre } from "../../../types/genre.types";

/**
 * Quản lý bảng thể loại.
 *
 * @returns State bảng, query danh sách thể loại và các action.
 */
export function useGenreTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "name" });
  const query = useGenres(table.filters);
  const remove = useDeleteGenre();
  const bulkDelete = useBulkDeleteGenres();

  return {
    table,
    query,
    view: (genre: Genre) => router.push(NOVEL_ROUTES.adminGenreDetail(genre.id)),
    edit: (genre: Genre) => router.push(withEditMode(NOVEL_ROUTES.adminGenreDetail(genre.id))),
    remove: (genre: Genre) => remove.mutateAsync(genre.id),
    bulkDelete: (genres: Genre[]) => bulkDelete.mutateAsync(genres.map((g) => g.id)),
  };
}
