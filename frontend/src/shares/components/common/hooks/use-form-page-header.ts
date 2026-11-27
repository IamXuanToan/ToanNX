"use client";

import { createContext, useEffect, useState } from "react";

/** Ô chứa thanh nút của form trên đầu `FormPage` (`null` khi chưa gắn hoặc không có `FormPage`). */
export const FormPageActionsContext = createContext<HTMLElement | null>(null);

/** Cờ cho biết `FormPage` đã gắn sẵn nút `Quay lại` cố định trên header (tránh lặp hoặc mất nút khi đổi tab). */
export const FormPageBackContext = createContext<boolean>(false);

const WORKSPACE_HEADER_HEIGHT = 64;
const STICKY_CLEARANCE_GAP = 4;

/**
 * State đầu trang của `FormPage`: phần tử ô chứa nút (để `FormActions` đưa nút lên), cờ "đã dính"
 * (đo bằng một mốc ngay trên đầu trang) và chiều cao đỉnh dính tổng để `TiptapToolbar` / khung xem
 * trước bên dưới dính ngay mép dưới card tiêu đề mà không bị che.
 *
 * @returns Hàm gắn mốc, hàm gắn thanh dính, độ cao top cho sticky con, cờ đã dính, ô chứa nút và hàm gắn ô.
 */
export function useFormPageHeader() {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [stickyBar, setStickyBar] = useState<HTMLDivElement | null>(null);
  const [stickyTop, setStickyTop] = useState(144);
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

  useEffect(() => {
    if (!stickyBar) return;
    const syncTop = () => {
      const measured = Math.ceil(
        WORKSPACE_HEADER_HEIGHT + stickyBar.offsetHeight + STICKY_CLEARANCE_GAP,
      );
      setStickyTop((prev) => (prev === measured ? prev : measured));
    };
    syncTop();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(syncTop);
    ro.observe(stickyBar);
    return () => ro.disconnect();
  }, [stickyBar]);

  return { setSentinel, setStickyBar, stickyTop, stuck, slot, setSlot };
}
