"use client";

import { useSyncExternalStore } from "react";

/**
 * Theo dõi một media query.
 *
 * @param query - Media query CSS.
 * @returns True nếu khớp (luôn false khi render phía server).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
