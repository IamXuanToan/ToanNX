"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { pagePathKeys } from "../constants/query-keys";
import { PAGE_PATH_PERMISSIONS } from "../permissions/page-path-permission";
import { pagePathService } from "../services/page-path.service";

/**
 * Toàn bộ đường dẫn giữa cho ô chọn (không phân trang).
 *
 * @param enabled - Có quyền xem.
 * @returns Danh mục đường dẫn giữa cho options.
 */
export function usePagePathOptions(enabled = true) {
  const canRead = usePermission(PAGE_PATH_PERMISSIONS.read);
  return useQuery({
    queryKey: pagePathKeys.options(),
    queryFn: ({ signal }) => pagePathService.listAll({ ordering: "position" }, signal),
    enabled: enabled && canRead,
  });
}
