"use client";

import { useState } from "react";

import { useTabState } from "@/shares/hooks/use-tab-state";

import { useVaultItem } from "../../../hooks/use-vault-item";
import { useVaultRevealDialog } from "./use-vault-reveal-dialog";

const VALID_TABS = ["general", "history"] as const;

/** @returns Query chi tiết mục Két sắt, tab đồng bộ `?tab=`, và dialog giải mã. */
export function useVaultItemDetail(id: string) {
  const query = useVaultItem(id);
  const [activeTab, setActiveTab] = useTabState({ validTabs: VALID_TABS, defaultTab: "general" });
  const [revealOpen, setRevealOpen] = useState(false);
  const revealDialog = useVaultRevealDialog();

  return {
    query,
    activeTab,
    setActiveTab,
    revealOpen,
    revealDialog,
    openReveal: async () => {
      setRevealOpen(true);
      await revealDialog.openReveal(id);
    },
    closeReveal: (open: boolean) => {
      setRevealOpen(open);
      if (!open) revealDialog.reset();
    },
  };
}
