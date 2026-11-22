/**
 * Hook quản lý trạng thái bảng quản trị danh sách tiểu thuyết.
 *
 * Bao gồm tìm kiếm, lọc trạng thái, phân trang URL, sắp xếp và các thao tác xóa đơn lẻ/hàng loạt.
 */

"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { novelKeys } from "../../../constants/query-keys";
import { novelService } from "../../../services/novel.service";
import { NOVEL_ROUTES } from "../../../constants/routes";
import { useDeleteNovel } from "../../../hooks/use-delete-novel";
import { useNovels } from "../../../hooks/use-novels";
import type { Novel } from "../../../types/novel.types";

/**
 * Quản lý trạng thái và các hành động của bảng tiểu thuyết quản trị.
 *
 * @returns State bảng, kết quả query danh sách và các hàm xóa / xóa hàng loạt.
 */
export function useNovelTable() {
  const router = useRouter();
  const table = useTableState({
    ordering: "-created_at",
    filterKeys: ["status"],
  });

  const statusValues = table.getFilterValues("status");
  const query = useNovels({
    ...table.filters,
    status: statusValues.length ? statusValues : undefined,
  });

  const remove = useDeleteNovel();
  const bulk = useBulkActions<Novel>({ service: novelService, invalidate: [novelKeys.novel.all] });
  return {
    bulkDelete: bulk.bulkDelete,
    bulkSetPublished: (rows: Novel[], value: boolean) =>
      bulk.bulkUpdate(rows, { isPublished: value }),
    table,
    query,
    view: (novel: Novel) => router.push(NOVEL_ROUTES.adminNovelDetail(novel.id)),
    edit: (novel: Novel) => router.push(withEditMode(NOVEL_ROUTES.adminNovelDetail(novel.id))),
    remove: (novel: Novel) => remove.mutateAsync(novel.id),
  };
}
