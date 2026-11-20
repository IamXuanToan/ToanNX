"use client";

import { useState } from "react";

/**
 * Hook quản lý portal slot phần chân của FormDialog.
 *
 * @returns Element slot hiện tại và callback ref setSlot.
 */
export function useFormDialog() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return {
    slot,
    setSlot,
  };
}
