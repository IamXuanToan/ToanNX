"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { financeKeys } from "../constants/query-keys";
import { PLATFORM_PERMISSIONS } from "../permissions/platform-permission";
import { platformService } from "../services/platform.service";
import { useFinancePersonalScope } from "./use-finance-personal-scope";

/** @returns Mọi nền tảng của mình (ô chọn), đang dùng trước. */
export function usePlatformOptions(enabled = true) {
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  const { personalOwnerId, scopeReady } = useFinancePersonalScope();
  return useQuery({
    queryKey: [...financeKeys.platforms.options(), personalOwnerId ?? "all"],
    queryFn: ({ signal }) =>
      platformService.listAll(
        { ordering: "name", ...(personalOwnerId ? { owner: personalOwnerId } : {}) },
        signal,
      ),
    enabled: enabled && canRead && scopeReady,
  });
}
