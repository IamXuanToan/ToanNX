"use client";

import { useCallback, useId, useSyncExternalStore } from "react";

import { PORTAL_SIDEBAR_COLLAPSED_KEY } from "../../../constants/navigation";

const SIDEBAR_CHANGE_EVENT = "portal-sidebar-sections-change";

function parseCollapsedSet(raw: string): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(PORTAL_SIDEBAR_COLLAPSED_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PORTAL_SIDEBAR_COLLAPSED_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  };
}

function writeCollapsedState(sectionKey: string, collapsed: boolean) {
  try {
    const current = parseCollapsedSet(getSnapshot());
    if (collapsed) current.add(sectionKey);
    else current.delete(sectionKey);
    window.localStorage.setItem(PORTAL_SIDEBAR_COLLAPSED_KEY, JSON.stringify([...current]));
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage (chế độ ẩn danh nghiêm ngặt)
  }
}

/**
 * Hook quản lý trạng thái đóng/mở theo từng nhóm của Sidebar Portal qua `useSyncExternalStore`
 * (lưu `localStorage`, đồng bộ SSR không lệch hydration), đồng thời giữ nhóm chứa trang đang
 * mở luôn mở để người dùng không mất ngữ cảnh.
 *
 * @param sectionKey - Mã cụm (`workspace`, `utilities`, `finance`).
 * @param hasActive - Cụm có chứa mục đang active hay không.
 * @returns Trạng thái `expanded`, `contentId` và `toggleOpen`.
 */
export function usePortalSidebarSection(sectionKey: string, hasActive: boolean) {
  const rawCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const contentId = useId();
  const isCollapsed = parseCollapsedSet(rawCollapsed).has(sectionKey);
  const expanded = !isCollapsed || hasActive;

  const toggleOpen = useCallback(() => {
    writeCollapsedState(sectionKey, expanded);
  }, [expanded, sectionKey]);

  return { expanded, contentId, toggleOpen };
}
