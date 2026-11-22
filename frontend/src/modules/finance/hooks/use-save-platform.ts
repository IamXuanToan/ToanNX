"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { platformService } from "../services/platform.service";
import type { Platform, PlatformInput } from "../types/platform.types";

/** @param id - Có id thì sửa, không thì tạo. @returns Mutation lưu nền tảng (form tự báo lỗi theo field). */
export function useSavePlatform(id?: string) {
  return useResourceMutation<PlatformInput, Platform>({
    mutationFn: (input) => (id ? platformService.update(id, input) : platformService.create(input)),
    invalidate: [financeKeys.all],
    toastError: false,
  });
}
