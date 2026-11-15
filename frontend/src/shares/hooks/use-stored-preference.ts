"use client";
import { useSyncExternalStore } from "react";
const EVENT = "stored-preference-change";
const memory = new Map<string, string>();
/** Cấu hình UI theo key: an toàn SSR, đồng bộ giữa các bảng/tab, không chứa dữ liệu cá nhân. */
export function useStoredPreference<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
) {
  const raw = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener(EVENT, notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener(EVENT, notify);
      };
    },
    () => {
      try {
        return localStorage.getItem(key) ?? memory.get(key) ?? null;
      } catch {
        return memory.get(key) ?? null;
      }
    },
    () => null,
  );
  let value = fallback;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (valid(parsed)) value = parsed;
  } catch {
    /* Dữ liệu lưu cũ/hỏng: dùng cấu hình mặc định. */
  }
  const update = (next: T) => {
    const raw = JSON.stringify(next);
    try {
      localStorage.setItem(key, raw);
      memory.delete(key);
    } catch {
      memory.set(key, raw); /* Storage bị chặn, vẫn giữ cấu hình trong bộ nhớ phiên. */
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [value, update] as const;
}
