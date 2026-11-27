"use client";

import { useAsset } from "../../../hooks/use-asset";

/** @returns Query chi tiết Thiết bị. */
export function useAssetDetail(id: string) {
  const query = useAsset(id);
  return { query };
}
