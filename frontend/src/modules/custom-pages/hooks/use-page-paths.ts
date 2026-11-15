"use client";

import { useQuery } from "@tanstack/react-query";

import { useListQuery } from "@/shares/hooks/use-list-query";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pagePathService } from "../services/page-path.service";
import type { PagePathFilters, PagePathInput } from "../types/custom-pages.types";

const INVALIDATE = [pagePathKeys.all, pageKeys.all];

/** @param filters - Bộ lọc và phân trang. @returns Danh sách đường dẫn giữa. */
export function usePagePaths(filters: PagePathFilters) {
  return useListQuery(pagePathKeys.list(filters), (signal) =>
    pagePathService.list(filters, signal),
  );
}

/** @param enabled - Có quyền xem. @returns Toàn bộ đường dẫn giữa cho ô chọn (không phân trang). */
export function usePagePathOptions(enabled = true) {
  return useQuery({
    queryKey: pagePathKeys.options(),
    queryFn: ({ signal }) => pagePathService.listAll({ ordering: "position" }, signal),
    enabled,
  });
}

/** @param id - Id. @param enabled - Tải khi cần. @returns Chi tiết. */
export function usePagePath(id: string, enabled = true) {
  return useQuery({
    queryKey: pagePathKeys.detail(id),
    queryFn: ({ signal }) => pagePathService.get(id, signal),
    enabled,
  });
}

/** @returns Mutation tạo đường dẫn giữa (lỗi do form tự hiện). */
export function useCreatePagePath() {
  return useResourceMutation({
    mutationFn: (input: PagePathInput) => pagePathService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @param id - Id. @returns Mutation sửa đường dẫn giữa (lỗi do form tự hiện). */
export function useUpdatePagePath(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<PagePathInput>) => pagePathService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @returns Mutation xóa đường dẫn giữa (còn trang → 409, toast lỗi đã dịch). */
export function useDeletePagePath() {
  return useResourceMutation({
    mutationFn: (id: string) => pagePathService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}

/** @returns Mutation bật/tắt một đường dẫn giữa. */
export function useSetPagePathActive() {
  return useResourceMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pagePathService.update(id, { isActive }),
    invalidate: INVALIDATE,
  });
}
