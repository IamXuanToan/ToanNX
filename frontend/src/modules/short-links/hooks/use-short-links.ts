"use client";

import { useQuery } from "@tanstack/react-query";

import { useListQuery } from "@/shares/hooks/use-list-query";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { shortLinkKeys } from "../constants/query-keys";
import { shortLinkService } from "../services/short-link.service";
import type { ShortLinkFilters, ShortLinkInput, ShortLinkStatus } from "../types/short-links.types";

const INVALIDATE = [shortLinkKeys.all];

/** @param filters - Bộ lọc và phân trang. @returns Danh sách link. */
export function useShortLinks(filters: ShortLinkFilters) {
  return useListQuery(shortLinkKeys.list(filters), (signal) =>
    shortLinkService.list(filters, signal),
  );
}

/** @param search - Từ khóa. @param enabled - Có quyền đọc. @returns Link của mình cho ô chọn (không phân trang). */
export function useShortLinkOptions(search = "", enabled = true) {
  return useQuery({
    queryKey: shortLinkKeys.options({ search }),
    queryFn: ({ signal }) => shortLinkService.listAll({ search, status: ["ACTIVE"] }, signal),
    enabled,
  });
}

/** @param id - Id. @param enabled - Tải khi cần. @returns Chi tiết link. */
export function useShortLink(id: string, enabled = true) {
  return useQuery({
    queryKey: shortLinkKeys.detail(id),
    queryFn: ({ signal }) => shortLinkService.get(id, signal),
    enabled,
  });
}

/** @returns Mutation tạo link (lỗi do form tự hiện). */
export function useCreateShortLink() {
  return useResourceMutation({
    mutationFn: (input: ShortLinkInput) => shortLinkService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @param id - Id. @returns Mutation sửa link (lỗi do form tự hiện). */
export function useUpdateShortLink(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<ShortLinkInput>) => shortLinkService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @returns Mutation xóa một link. */
export function useDeleteShortLink() {
  return useResourceMutation({
    mutationFn: (id: string) => shortLinkService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}

/** @returns Mutation bật/tắt nhiều link. */
export function useBulkSetShortLinkStatus() {
  return useResourceMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ShortLinkStatus }) =>
      shortLinkService.bulkSetStatus(ids, status),
    invalidate: INVALIDATE,
    success: "bulkUpdated",
  });
}

/** @returns Mutation xóa nhiều link. */
export function useBulkDeleteShortLinks() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => shortLinkService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
