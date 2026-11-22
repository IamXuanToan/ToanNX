"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";

/** @returns Mutation xóa kết nối. */
export function useDeleteSepayConnection() {
  return useResourceMutation<void, void>({
    mutationFn: () => sepayConnectionService.remove(),
    invalidate: [financeKeys.all],
    success: "deleted",
  });
}
