"use client";

import { useQuery } from "@tanstack/react-query";

import { callbackKeys } from "../constants/query-keys";
import { callbackService } from "../services/callback.service";

/** @returns Truy vấn danh mục callback. */
export function useCallbacks() {
  return useQuery({
    queryKey: callbackKeys.all,
    queryFn: ({ signal }) => callbackService.list(signal),
  });
}
