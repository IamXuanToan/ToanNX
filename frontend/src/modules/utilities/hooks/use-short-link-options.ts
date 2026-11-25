"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { shortLinkKeys } from "../constants/query-keys";
import { SHORT_LINK_PERMISSIONS } from "../permissions/short-link-permission";
import { shortLinkService } from "../services/short-link.service";

/**
 * Lấy danh sách link rút gọn của chính mình phục vụ chọn lựa chọn (không phân trang).
 *
 * @param search - Từ khóa tìm kiếm.
 * @param enabled - Điều kiện kích hoạt ngoài quyền đọc.
 * @returns Truy vấn React Query danh sách link rút gọn cho options.
 */
export function useShortLinkOptions(search = "", enabled = true) {
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  return useQuery({
    queryKey: shortLinkKeys.options({ search }),
    queryFn: ({ signal }) => shortLinkService.listAll({ search, status: ["ACTIVE"] }, signal),
    enabled: enabled && canRead,
  });
}
