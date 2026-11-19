/**
 * Hook quản lý trạng thái bảng quản trị danh sách tiểu thuyết.
 *
 * Bao gồm tìm kiếm, lọc trạng thái, phân trang URL, sắp xếp và các thao tác xóa đơn lẻ/hàng loạt.
 */

"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";

import { NOVEL_ROUTES } from "../../../constants/routes";
import { useBulkDeleteNovels } from "../../../hooks/use-bulk-delete-novels";
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
  const bulkDelete = useBulkDeleteNovels();

  const ids = (novels: Novel[]) => novels.map((novel) => novel.id);

  return {
    table,
    query,
    edit: (novel: Novel) => router.push(NOVEL_ROUTES.adminNovelDetail(novel.id)),
    remove: (novel: Novel) => remove.mutateAsync(novel.id),
    bulkDelete: (novels: Novel[]) => bulkDelete.mutateAsync(ids(novels)),
  };
}
