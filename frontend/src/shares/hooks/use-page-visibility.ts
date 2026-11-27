"use client";

import { useEffect, useState } from "react";

/**
 * Theo dõi trạng thái tab trình duyệt đang hiển thị (`document.visibilityState === "visible"`).
 * Dùng để tạm dừng polling/tác vụ nền khi tab bị ẩn hoặc thu nhỏ.
 *
 * @returns `true` khi tab đang hiển thị trước mặt người dùng.
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(() =>
    typeof document === "undefined" ? true : document.visibilityState !== "hidden",
  );

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return isVisible;
}
