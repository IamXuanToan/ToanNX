"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { financeKeys } from "../constants/query-keys";
import { PLATFORM_PERMISSIONS } from "../permissions/platform-permission";
import { platformService } from "../services/platform.service";

/** @returns Mọi nền tảng của mình (ô chọn), đang dùng trước. */
export function usePlatformOptions(enabled = true) {
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  return useQuery({
    queryKey: financeKeys.platforms.options(),
    queryFn: ({ signal }) => platformService.listAll({ ordering: "name" }, signal),
    enabled: enabled && canRead,
  });
}
