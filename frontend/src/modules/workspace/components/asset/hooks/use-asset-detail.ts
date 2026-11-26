"use client";

import { useTabState } from "@/shares/hooks/use-tab-state";

import { useAsset } from "../../../hooks/use-asset";

const VALID_TABS = ["general", "claims", "history"] as const;

/** @returns Query chi tiết Thiết bị và trạng thái Tab đồng bộ `?tab=`. */
export function useAssetDetail(id: string) {
  const query = useAsset(id);
  const [activeTab, setActiveTab] = useTabState({ validTabs: VALID_TABS, defaultTab: "general" });
  return { query, activeTab, setActiveTab };
}
