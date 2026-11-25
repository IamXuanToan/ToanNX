"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export type UseTabStateOptions<T extends string> = {
  /** Danh sách các tab hợp lệ được phép kích hoạt. */
  validTabs: readonly T[];
  /** Tab mặc định nếu URL không có tham số query hoặc giá trị không hợp lệ. */
  defaultTab: T;
  /** Tên tham số query trên URL, mặc định là "tab". */
  paramName?: string;
};

/**
 * Hook quản lý trạng thái Tab được đồng bộ 2 chiều với URL query parameter (`?tab=...`).
 *
 * Tính năng:
 * - Tự động đọc tab từ query string của URL khi khởi tạo hoặc khi người dùng dán liên kết có chứa tab.
 * - Cập nhật URL qua `window.history.replaceState` khi chuyển tab (không kích hoạt router reload).
 * - Tự động fallback về `defaultTab` nếu giá trị trên URL không nằm trong `validTabs`.
 * - Hỗ trợ đồng bộ tab khi người dùng nhấn back/forward trình duyệt.
 *
 * @param options - Cấu hình danh sách tab hợp lệ, tab mặc định và tên query param.
 * @returns Cặp `[activeTab, setTab]` tương thích chuẩn với component Tabs của Radix/shadcn.
 */
export function useTabState<T extends string>({
  validTabs,
  defaultTab,
  paramName = "tab",
}: UseTabStateOptions<T>) {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get(paramName) as T | null;

  const resolvedTab = queryParam && validTabs.includes(queryParam) ? queryParam : defaultTab;

  const [prevParam, setPrevParam] = useState<T>(resolvedTab);
  const [activeTab, setActiveTabState] = useState<T>(resolvedTab);

  // Đồng bộ tức thì theo chuẩn React 19 (không dùng effect gây cascading render)
  if (prevParam !== resolvedTab) {
    setPrevParam(resolvedTab);
    setActiveTabState(resolvedTab);
  }

  const setTab = useCallback(
    (nextTab: T) => {
      if (!validTabs.includes(nextTab)) return;
      setActiveTabState(nextTab);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set(paramName, nextTab);
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      }
    },
    [paramName, validTabs],
  );

  return [activeTab, setTab] as const;
}
