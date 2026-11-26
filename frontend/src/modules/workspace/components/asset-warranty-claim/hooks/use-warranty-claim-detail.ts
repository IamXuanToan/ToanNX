"use client";

import { useTabState } from "@/shares/hooks/use-tab-state";

import { useWarrantyClaim } from "../../../hooks/use-warranty-claim";

const VALID_TABS = ["general", "history"] as const;

/** @returns Query chi tiết Phiếu bảo hành và tab hiện tại. */
export function useWarrantyClaimDetail(id: string) {
  const query = useWarrantyClaim(id);
  const [activeTab, setActiveTab] = useTabState({ validTabs: VALID_TABS, defaultTab: "general" });
  return { query, activeTab, setActiveTab };
}
