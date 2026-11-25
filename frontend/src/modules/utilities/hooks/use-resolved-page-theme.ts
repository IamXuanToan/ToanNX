"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { type ResolvedPageTheme, resolvePageTheme } from "../lib/page-theme";
import type { PublicPage } from "../types/page.types";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook đọc `resolvedTheme` của hệ thống an toàn với SSR/hydration để renderer Page tự cập nhật
 * khi người dùng hoặc hệ điều hành đổi Light/Dark.
 *
 * @param page - Dữ liệu trang công khai.
 * @returns Kết quả phân giải giao diện `ResolvedPageTheme`.
 */
export function useResolvedPageTheme(page: PublicPage): ResolvedPageTheme {
  const { resolvedTheme } = useTheme();
  const isMounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  return resolvePageTheme(page, isMounted ? resolvedTheme : undefined);
}
