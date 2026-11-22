"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useBulkDeletePages } from "../../../hooks/use-bulk-delete-pages";
import { useBulkSetPageStatus } from "../../../hooks/use-bulk-set-page-status";
import { useDeletePage } from "../../../hooks/use-delete-page";
import { useDuplicatePage } from "../../../hooks/use-duplicate-page";
import { usePagePathOptions } from "../../../hooks/use-page-path-options";
import { usePages } from "../../../hooks/use-pages";
import { PAGE_STATUSES, type Page, type PageStatus } from "../../../types/page.types";

/**
 * State bảng trang: tìm, lọc trạng thái và đường dẫn giữa (chọn nhiều), sắp xếp, phân trang URL, xóa,
 * nhân bản, công khai/ngừng công khai hàng loạt.
 *
 * @returns Truy vấn, danh mục đường dẫn, state bảng và handler.
 */
export function usePageTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "-created_at", filterKeys: ["status", "path"] });
  const paths = usePagePathOptions();
  const path = table.getFilterValues("path");
  const query = usePages({
    ...table.filters,
    status: pickAllowedValues(table.getFilterValues("status"), PAGE_STATUSES),
    path: path.length ? path : undefined,
  });
  const remove = useDeletePage();
  const duplicate = useDuplicatePage();
  const bulkStatus = useBulkSetPageStatus();
  const bulkDelete = useBulkDeletePages();
  const ids = (pages: Page[]) => pages.map((page) => page.id);
  return {
    table,
    query,
    paths,
    view: (page: Page) => router.push(UTILITIES_ROUTES.pageDetail(page.id)),
    edit: (page: Page) => router.push(withEditMode(UTILITIES_ROUTES.pageDetail(page.id))),
    duplicate: async (page: Page) => {
      const copy = await duplicate.mutateAsync(page.id);
      router.push(UTILITIES_ROUTES.pageDetail(copy.id));
    },
    remove: (page: Page) => remove.mutateAsync(page.id),
    bulkSetStatus: (pages: Page[], status: PageStatus) =>
      bulkStatus.mutateAsync({ ids: ids(pages), status }),
    bulkDelete: (pages: Page[]) => bulkDelete.mutateAsync(ids(pages)),
  };
}
