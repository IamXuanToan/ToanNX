"use client";

import { useTabState } from "@/shares/hooks/use-tab-state";

import { useReminder } from "../../../hooks/use-reminder";

const VALID_TABS = ["general", "history"] as const;

/** @returns Query chi tiết Nhắc việc và tab `?tab=`. */
export function useReminderDetail(id: string) {
  const query = useReminder(id);
  const [activeTab, setActiveTab] = useTabState({ validTabs: VALID_TABS, defaultTab: "general" });
  return { query, activeTab, setActiveTab };
}
