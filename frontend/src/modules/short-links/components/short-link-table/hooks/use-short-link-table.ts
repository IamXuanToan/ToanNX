"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { SHORT_LINKS_ROUTES } from "../../../constants/routes";
import { useBulkDeleteShortLinks } from "../../../hooks/use-bulk-delete-short-links";
import { useBulkSetShortLinkStatus } from "../../../hooks/use-bulk-set-short-link-status";
import { useDeleteShortLink } from "../../../hooks/use-delete-short-link";
import { useShortLinks } from "../../../hooks/use-short-links";
import {
  SHORT_LINK_FILTER_STATUSES,
  type ShortLink,
  type ShortLinkStatus,
} from "../../../types/short-link.types";

/**
 * State bảng link rút gọn: tìm, lọc trạng thái (gồm EXPIRED), sắp xếp, phân trang URL,
 * bật/tắt ở cột Trạng thái, xóa, thao tác hàng loạt.
 *
 * @returns Truy vấn, state bảng và handler.
 */
export function useShortLinkTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "-created_at", filterKeys: ["status"] });
  const query = useShortLinks({
    ...table.filters,
    status: pickAllowedValues(table.getFilterValues("status"), SHORT_LINK_FILTER_STATUSES),
  });
  const remove = useDeleteShortLink();
  const bulkStatus = useBulkSetShortLinkStatus();
  const bulkDelete = useBulkDeleteShortLinks();
  const ids = (links: ShortLink[]) => links.map((link) => link.id);
  return {
    table,
    query,
    edit: (link: ShortLink) => router.push(SHORT_LINKS_ROUTES.linkDetail(link.id)),
    setStatus: (link: ShortLink, status: ShortLinkStatus) =>
      bulkStatus.mutate({ ids: [link.id], status }),
    remove: (link: ShortLink) => remove.mutateAsync(link.id),
    bulkSetStatus: (links: ShortLink[], status: ShortLinkStatus) =>
      bulkStatus.mutateAsync({ ids: ids(links), status }),
    bulkDelete: (links: ShortLink[]) => bulkDelete.mutateAsync(ids(links)),
  };
}
