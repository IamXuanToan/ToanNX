"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";
import type { NotificationScope } from "../types/notification.types";

/** @param scope - Tab. @param enabled - Chỉ tải khi mở chuông. @returns Danh sách vô hạn (20/lần). */
export function useNotifications(scope: NotificationScope, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.bell(scope),
    queryFn: ({ pageParam, signal }) => notificationService.list(scope, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled,
  });
}
