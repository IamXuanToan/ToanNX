"use client";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useBulkDeleteShortLinks } from "../../../hooks/use-bulk-delete-short-links";
import { useBulkSetShortLinkStatus } from "../../../hooks/use-bulk-set-short-link-status";
import { useDeleteShortLink } from "../../../hooks/use-delete-short-link";
import { useShortLinks } from "../../../hooks/use-short-links";
import {
  SHORT_LINK_FILTER_STATUSES,
  type ShortLink,
  type ShortLinkStatus,
} from "../../../types/short-link.types";

type DetailRouteFn = (id: string) => { pathname: string; params: Record<string, string> };

/**
 * State bảng link rút gọn: tìm, lọc trạng thái (gồm EXPIRED), sắp xếp, phân trang URL,
 * bật/tắt ở cột Trạng thái, xóa, thao tác hàng loạt. Hỗ trợ tùy biến detailRoute và ownerOnly cho Client Portal.
 *
 * @param options - Tùy chọn lọc chủ sở hữu và hàm sinh route chi tiết.
 * @returns Truy vấn, state bảng và handler.
 */
export function useShortLinkTable(options?: {
  ownerOnly?: boolean;
  ownerId?: string;
  detailRoute?: DetailRouteFn;
}) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const effectiveOwnerId =
    options?.ownerId ?? (options?.ownerOnly ? currentUser?.user.id : undefined);

  const table = useTableState({ ordering: "-created_at", filterKeys: ["status"] });
  const query = useShortLinks({
    ...table.filters,
    status: pickAllowedValues(table.getFilterValues("status"), SHORT_LINK_FILTER_STATUSES),
    owner: effectiveOwnerId ? [effectiveOwnerId] : undefined,
  });
  const remove = useDeleteShortLink();
  const bulkStatus = useBulkSetShortLinkStatus();
  const bulkDelete = useBulkDeleteShortLinks();
  const ids = (links: ShortLink[]) => links.map((link) => link.id);

  const getTargetRoute = (id: string) =>
    (options?.detailRoute
      ? options.detailRoute(id)
      : UTILITIES_ROUTES.shortLinkDetail(id)) as Parameters<typeof router.push>[0];

  return {
    table,
    query,
    view: (link: ShortLink) => router.push(getTargetRoute(link.id)),
    edit: (link: ShortLink) => {
      const route = options?.detailRoute
        ? options.detailRoute(link.id)
        : UTILITIES_ROUTES.shortLinkDetail(link.id);
      router.push(withEditMode(route) as Parameters<typeof router.push>[0]);
    },
    setStatus: (link: ShortLink, status: ShortLinkStatus) =>
      bulkStatus.mutate({ ids: [link.id], status }),
    remove: (link: ShortLink) => remove.mutateAsync(link.id),
    bulkSetStatus: (links: ShortLink[], status: ShortLinkStatus) =>
      bulkStatus.mutateAsync({ ids: ids(links), status }),
    bulkDelete: (links: ShortLink[]) => bulkDelete.mutateAsync(ids(links)),
  };
}
