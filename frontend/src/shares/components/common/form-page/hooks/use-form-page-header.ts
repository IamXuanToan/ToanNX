"use client";

import { createContext, useEffect, useState } from "react";

/** Ô chứa thanh nút của form trên đầu `FormPage` (`null` khi chưa gắn hoặc không có `FormPage`). */
export const FormPageActionsContext = createContext<HTMLElement | null>(null);

/**
 * State đầu trang của `FormPage`: phần tử ô chứa nút (để `FormActions` đưa nút lên) và cờ "đã dính"
 * (đo bằng một mốc ngay trên đầu trang: mốc khuất dưới header là đầu trang đang dính).
 *
 * @returns Hàm gắn mốc, cờ đã dính, ô chứa nút và hàm gắn ô.
 */
export function useFormPageHeader() {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!sentinel) return;
    // Header của workspace cao 64px: mốc đi qua mép dưới header thì coi là đã dính.
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: "-65px 0px 0px 0px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel]);

  return { setSentinel, stuck, slot, setSlot };
}
