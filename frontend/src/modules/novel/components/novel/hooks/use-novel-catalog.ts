/**
 * Hook quản lý trạng thái tìm kiếm, lọc và phân trang của trang danh mục tiểu thuyết công khai.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { novelKeys } from "../../../constants/query-keys";
import { useReadingHistory } from "../../../hooks/use-reading-history";
import { novelService } from "../../../services/novel.service";
import type { Novel } from "../../../types/novel.types";

/**
 * Quản lý danh mục tiểu thuyết, bộ lọc từ khóa, trạng thái và tiến độ đọc dở.
 *
 * @returns Trạng thái danh mục, danh sách truyện, từ khóa tìm kiếm và hàm thay đổi.
 */
export function useNovelCatalog() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "ALL";

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  const { data: history } = useReadingHistory();

  const historyMap = new Map<string, number>();
  if (history) {
    for (const item of history) {
      if (item.novelId && !historyMap.has(item.novelId)) {
        historyMap.set(item.novelId, item.chapterNumber);
      }
    }
  }

  const query = useQuery({
    queryKey: novelKeys.catalog({ search, status }),
    queryFn: async ({ signal }) => {
      const params: Record<string, string> = {
        ordering: "-created_at",
        page_size: "50",
      };
      if (search.trim()) params.search = search.trim();
      if (status !== "ALL") params.status = status;
      return novelService.list(params, signal);
    },
  });

  const novels: Novel[] = query.data
    ? Array.isArray(query.data)
      ? query.data
      : query.data.items || []
    : [];

  return {
    novels,
    isLoading: query.isLoading,
    isError: query.isError,
    search,
    setSearch,
    status,
    setStatus,
    historyMap,
  };
}
