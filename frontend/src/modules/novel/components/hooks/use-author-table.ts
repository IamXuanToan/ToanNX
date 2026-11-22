/**
 * Hook quản lý trạng thái bảng tác giả: tìm kiếm, sắp xếp, phân trang, sửa, xóa và xóa hàng loạt.
 */

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { NOVEL_ROUTES } from "../../constants/routes";
import { useAuthors } from "../../hooks/use-authors";
import { useBulkDeleteAuthors } from "../../hooks/use-bulk-delete-authors";
import { useDeleteAuthor } from "../../hooks/use-delete-author";
import type { Author } from "../../types/author.types";

/**
 * Quản lý trạng thái và thao tác bảng tác giả.
 *
 * @returns State bảng, query danh sách tác giả, và các action.
 */
export function useAuthorTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "name" });
  const query = useAuthors(table.filters);
  const remove = useDeleteAuthor();
  const bulkDelete = useBulkDeleteAuthors();

  return {
    table,
    query,
    view: (author: Author) => router.push(NOVEL_ROUTES.adminAuthorDetail(author.id)),
    edit: (author: Author) => router.push(withEditMode(NOVEL_ROUTES.adminAuthorDetail(author.id))),
    remove: (author: Author) => remove.mutateAsync(author.id),
    bulkDelete: (authors: Author[]) => bulkDelete.mutateAsync(authors.map((a) => a.id)),
  };
}
