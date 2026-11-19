"use client";

import { useQuery } from "@tanstack/react-query";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";

/**
 * Lấy danh sách link rút gọn của chính mình phục vụ chọn lựa chọn (không phân trang).
 *
 * @param search - Từ khóa tìm kiếm.
 * @param enabled - Có quyền đọc hay không.
 * @returns Truy vấn React Query danh sách link rút gọn cho options.
 */
export function useShortLinkOptions(search = "", enabled = true) {
  return useQuery({
    queryKey: shortLinkKeys.options({ search }),
    queryFn: ({ signal }) => shortLinkService.listAll({ search, status: ["ACTIVE"] }, signal),
    enabled,
  });
}
