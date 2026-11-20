"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { useDeletePagePath } from "../../hooks/use-delete-page-path";
import { usePagePaths } from "../../hooks/use-page-paths";
import { useSetPagePathActive } from "../../hooks/use-set-page-path-active";
import type { PagePath } from "../../types/page-path.types";

/**
 * State bảng đường dẫn giữa: tìm, lọc bật/tắt, sắp xếp, phân trang URL, bật/tắt ở cột Trạng thái, xóa.
 *
 * @returns Truy vấn, state bảng và handler.
 */
export function usePagePathTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "position", filterKeys: ["isActive"] });
  const query = usePagePaths({
    ...table.filters,
    isActive: pickAllowedValues(table.getFilterValues("isActive"), ["true", "false"] as const),
  });
  const remove = useDeletePagePath();
  const setActive = useSetPagePathActive();
  return {
    table,
    query,
    edit: (path: PagePath) => router.push(UTILITIES_ROUTES.pagePathDetail(path.id)),
    setActive: (path: PagePath, isActive: boolean) => setActive.mutate({ id: path.id, isActive }),
    remove: (path: PagePath) => remove.mutateAsync(path.id),
  };
}
