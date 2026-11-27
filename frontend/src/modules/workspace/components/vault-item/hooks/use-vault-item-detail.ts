"use client";

import { useState } from "react";

import { useVaultItem } from "../../../hooks/use-vault-item";
import { useVaultRevealDialog } from "./use-vault-reveal-dialog";

/** @returns Query chi tiết mục Két sắt và dialog giải mã. */
export function useVaultItemDetail(id: string) {
  const query = useVaultItem(id);
  const [revealOpen, setRevealOpen] = useState(false);
  const revealDialog = useVaultRevealDialog();

  return {
    query,
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
