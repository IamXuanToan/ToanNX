"use client";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useBulkDeletePages } from "../../../hooks/use-bulk-delete-pages";
import { useBulkSetPageStatus } from "../../../hooks/use-bulk-set-page-status";
import { useDeletePage } from "../../../hooks/use-delete-page";
import { useDuplicatePage } from "../../../hooks/use-duplicate-page";
import { usePagePathOptions } from "../../../hooks/use-page-path-options";
import { usePages } from "../../../hooks/use-pages";
import { PAGE_STATUSES, PAGE_TYPES, type Page, type PageStatus } from "../../../types/page.types";

type DetailRouteFn = (id: string) => { pathname: string; params: Record<string, string> };

/**
 * State bảng trang: tìm kiếm, lọc theo trạng thái, đường dẫn giữa và loại trang (Affiliate, Bio, Donation...),
 * sắp xếp, phân trang URL, xóa, nhân bản, đổi trạng thái hàng loạt. Hỗ trợ tùy biến detailRoute và ownerOnly cho Client Portal.
 *
 * @param options - Tùy chọn lọc chủ sở hữu và hàm sinh route chi tiết.
 * @returns Truy vấn, danh mục đường dẫn, state bảng và handler.
 */
export function usePageTable(options?: {
  ownerOnly?: boolean;
  ownerId?: string;
  detailRoute?: DetailRouteFn;
}) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const effectiveOwnerId =
    options?.ownerId ?? (options?.ownerOnly ? currentUser?.user.id : undefined);

  const table = useTableState({
    ordering: "-created_at",
    filterKeys: ["status", "path", "pageType"],
  });
  const paths = usePagePathOptions();
  const path = table.getFilterValues("path");
  const query = usePages({
    ...table.filters,
    status: pickAllowedValues(table.getFilterValues("status"), PAGE_STATUSES),
    pageType: pickAllowedValues(table.getFilterValues("pageType"), PAGE_TYPES),
    path: path.length ? path : undefined,
    owner: effectiveOwnerId ? [effectiveOwnerId] : undefined,
  });
  const remove = useDeletePage();
  const duplicate = useDuplicatePage();
  const bulkStatus = useBulkSetPageStatus();
  const bulkDelete = useBulkDeletePages();
  const ids = (pages: Page[]) => pages.map((page) => page.id);

  const getTargetRoute = (id: string) =>
    (options?.detailRoute
      ? options.detailRoute(id)
      : UTILITIES_ROUTES.pageDetail(id)) as Parameters<typeof router.push>[0];

  return {
    table,
    query,
    paths,
    view: (page: Page) => router.push(getTargetRoute(page.id)),
    edit: (page: Page) => {
      const route = options?.detailRoute
        ? options.detailRoute(page.id)
        : UTILITIES_ROUTES.pageDetail(page.id);
      router.push(withEditMode(route) as Parameters<typeof router.push>[0]);
    },
    duplicate: async (page: Page) => {
      const copy = await duplicate.mutateAsync(page.id);
      router.push(getTargetRoute(copy.id));
    },
    remove: (page: Page) => remove.mutateAsync(page.id),
    bulkSetStatus: (pages: Page[], status: PageStatus) =>
      bulkStatus.mutateAsync({ ids: ids(pages), status }),
    bulkDelete: (pages: Page[]) => bulkDelete.mutateAsync(ids(pages)),
  };
}
