"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { CUSTOM_PAGES_ROUTES } from "../../../constants/routes";
import {
  useDeletePagePath,
  usePagePaths,
  useSetPagePathActive,
} from "../../../hooks/use-page-paths";
import type { PagePath } from "../../../types/custom-pages.types";

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
    edit: (path: PagePath) => router.push(CUSTOM_PAGES_ROUTES.pathDetail(path.id)),
    setActive: (path: PagePath, isActive: boolean) => setActive.mutate({ id: path.id, isActive }),
    remove: (path: PagePath) => remove.mutateAsync(path.id),
  };
}
