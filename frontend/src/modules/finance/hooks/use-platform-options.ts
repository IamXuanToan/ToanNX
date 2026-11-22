"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { platformService } from "../services/platform.service";

/** @returns Mọi nền tảng của mình (ô chọn), đang dùng trước. */
export function usePlatformOptions() {
  return useQuery({
    queryKey: financeKeys.platforms.options(),
    queryFn: ({ signal }) => platformService.listAll({ ordering: "name" }, signal),
  });
}
