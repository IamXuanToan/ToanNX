"use client";

import { useQuery } from "@tanstack/react-query";

import { useListQuery } from "@/shares/hooks/use-list-query";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { pageKeys, pagePathKeys } from "../constants/query-keys";
import { pageService } from "../services/page.service";
import type { PageFilters, PageInput, PageStatus } from "../types/custom-pages.types";

const INVALIDATE = [pageKeys.all, pagePathKeys.all];

/** @param filters - Bộ lọc và phân trang. @returns Danh sách trang. */
export function usePages(filters: PageFilters) {
  return useListQuery(pageKeys.list(filters), (signal) => pageService.list(filters, signal));
}

/** @param id - Id. @returns Chi tiết trang cho editor. */
export function usePage(id: string) {
  return useQuery({
    queryKey: pageKeys.detail(id),
    queryFn: ({ signal }) => pageService.get(id, signal),
  });
}

/** @returns Mutation tạo trang (lỗi do form tự hiện). */
export function useCreatePage() {
  return useResourceMutation({
    mutationFn: (input: PageInput) => pageService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @param id - Id. @returns Mutation lưu trang (lỗi, kể cả lệch phiên bản, do form tự hiện). */
export function useUpdatePage(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<PageInput>) => pageService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}

/** @returns Mutation xóa một trang. */
export function useDeletePage() {
  return useResourceMutation({
    mutationFn: (id: string) => pageService.remove(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}

/** @returns Mutation đổi trạng thái nhiều trang. */
export function useBulkSetPageStatus() {
  return useResourceMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: PageStatus }) =>
      pageService.bulkSetStatus(ids, status),
    invalidate: INVALIDATE,
    success: "bulkUpdated",
  });
}

/** @returns Mutation xóa nhiều trang. */
export function useBulkDeletePages() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => pageService.bulkRemove(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}

/** @returns Mutation nhân bản trang. */
export function useDuplicatePage() {
  return useResourceMutation({
    mutationFn: (id: string) => pageService.duplicate(id),
    invalidate: INVALIDATE,
  });
}
