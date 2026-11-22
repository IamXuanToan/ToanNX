"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { pushDeviceService } from "../services/push-device.service";

/** @param enabled - Có quyền. @returns Trình duyệt đã bật thông báo. */
export function usePushDevices(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: ({ signal }) => pushDeviceService.list(signal),
    enabled,
  });
}
