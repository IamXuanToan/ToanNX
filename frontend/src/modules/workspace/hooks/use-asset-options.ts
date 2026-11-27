"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assetService } from "../services/asset.service";

/** @returns Danh sách thiết bị dạng option `{ value, label }` dùng cho bộ lọc / form chọn. */
export function useAssetOptions(enabled = true) {
  const query = useQuery({
    queryKey: workspaceKeys.assets.list({ ordering: "name" }),
    queryFn: ({ signal }) => assetService.listAll({ ordering: "name" }, signal),
    enabled,
  });
  return {
    ...query,
    options: (query.data ?? []).map((item) => ({
      value: item.id,
      label: item.brand ? `${item.name} (${item.brand})` : item.name,
    })),
  };
}
