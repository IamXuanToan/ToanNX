"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { CUSTOM_PAGES_ROUTES } from "../../../constants/routes";
import { usePagePathOptions } from "../../../hooks/use-page-paths";
import {
  useBulkDeletePages,
  useBulkSetPageStatus,
  useDeletePage,
  useDuplicatePage,
  usePages,
} from "../../../hooks/use-pages";
import { PAGE_STATUSES, type Page, type PageStatus } from "../../../types/custom-pages.types";

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
    edit: (page: Page) => router.push(CUSTOM_PAGES_ROUTES.pageDetail(page.id)),
    duplicate: async (page: Page) => {
      const copy = await duplicate.mutateAsync(page.id);
      router.push(CUSTOM_PAGES_ROUTES.pageDetail(copy.id));
    },
    remove: (page: Page) => remove.mutateAsync(page.id),
    bulkSetStatus: (pages: Page[], status: PageStatus) =>
      bulkStatus.mutateAsync({ ids: ids(pages), status }),
    bulkDelete: (pages: Page[]) => bulkDelete.mutateAsync(ids(pages)),
  };
}
