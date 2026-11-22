"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";
import type { SepayStatus } from "../types/sepay.types";

/** @returns Mutation lưu token / bật tắt kết nối. */
export function useSaveSepayConnection() {
  return useResourceMutation<{ token?: string; isActive?: boolean }, SepayStatus>({
    mutationFn: (input) => sepayConnectionService.save(input),
    invalidate: [financeKeys.all],
    success: "saved",
  });
}
