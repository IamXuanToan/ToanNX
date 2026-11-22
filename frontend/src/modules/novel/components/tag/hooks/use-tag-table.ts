/**
 * Hook quản lý trạng thái bảng thẻ.
 */

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { NOVEL_ROUTES } from "../../../constants/routes";
import { useBulkDeleteTags } from "../../../hooks/use-bulk-delete-tags";
import { useDeleteTag } from "../../../hooks/use-delete-tag";
import { useTags } from "../../../hooks/use-tags";
import type { Tag } from "../../../types/tag.types";

/**
 * Quản lý bảng thẻ phân loại.
 *
 * @returns State bảng, query danh sách thẻ và các action.
 */
export function useTagTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "name" });
  const query = useTags(table.filters);
  const remove = useDeleteTag();
  const bulkDelete = useBulkDeleteTags();

  return {
    table,
    query,
    view: (tag: Tag) => router.push(NOVEL_ROUTES.adminTagDetail(tag.id)),
    edit: (tag: Tag) => router.push(withEditMode(NOVEL_ROUTES.adminTagDetail(tag.id))),
    remove: (tag: Tag) => remove.mutateAsync(tag.id),
    bulkDelete: (tags: Tag[]) => bulkDelete.mutateAsync(tags.map((t) => t.id)),
  };
}
