"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { financeKeys } from "../constants/query-keys";
import { platformService } from "../services/platform.service";
import type { PlatformFilters } from "../types/platform.types";

/** @param filters - Bộ lọc + phân trang. @param options - Tùy chọn bật/tắt truy vấn. @returns Danh sách nền tảng. */
export function usePlatforms(filters: PlatformFilters, options: { enabled?: boolean } = {}) {
  return useListQuery(
    financeKeys.platforms.list(filters),
    (signal) => platformService.list(filters, signal),
    options,
  );
}
