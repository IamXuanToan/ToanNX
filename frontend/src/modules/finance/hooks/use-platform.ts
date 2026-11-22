"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { platformService } from "../services/platform.service";

/** @param id - Id bản ghi. @returns Chi tiết nền tảng. */
export function usePlatform(id: string) {
  return useQuery({
    queryKey: financeKeys.platforms.detail(id),
    queryFn: ({ signal }) => platformService.get(id, signal),
  });
}
