"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useRevealVaultItem } from "../../../hooks/use-reveal-vault-item";
import type { VaultItemReveal } from "../../../types/vault-item.types";

/** @returns State giải mã mục Két sắt và sao chép secret vào clipboard. */
export function useVaultRevealDialog() {
  const t = useTranslations("workspace.vault");
  const reveal = useRevealVaultItem();
  const [revealed, setRevealed] = useState<VaultItemReveal | null>(null);

  return {
    revealed,
    isRevealing: reveal.isPending,
    openReveal: async (id: string) => {
      setRevealed(null);
      const data = await reveal.mutateAsync(id);
      setRevealed(data);
    },
    reset: () => setRevealed(null),
    copySecret: async () => {
      if (!revealed?.secret || typeof navigator === "undefined" || !navigator.clipboard) return;
      await navigator.clipboard.writeText(revealed.secret);
      toast.success(t("copied"));
    },
  };
}
