"use client";

import { useQuery } from "@tanstack/react-query";

import { webhookKeys } from "../constants/query-keys";
import { webhookService } from "../services/webhook.service";

/** @returns Truy vấn danh mục webhook. */
export function useWebhooks() {
  return useQuery({
    queryKey: webhookKeys.all,
    queryFn: ({ signal }) => webhookService.list(signal),
  });
}
