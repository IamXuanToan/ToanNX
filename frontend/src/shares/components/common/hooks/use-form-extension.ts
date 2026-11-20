"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";

/** Việc chạy sau khi form lưu xong bản ghi chính (gán vai trò cho người dùng vừa tạo/sửa…). */
export type FormExtensionHandler = (record: { id: string }) => unknown;

type FormExtensionContextValue = {
  register: (handler: FormExtensionHandler) => () => void;
  setDirty: (key: string, dirty: boolean) => void;
  disabled: boolean;
};

/**
 * Cầu nối giữa form của một module và phần mở rộng do module khác cắm qua slot (page ghép).
 * Form bọc slot bằng `FormExtensionContext.Provider value={registry.context}`; slot gọi
 * `useFormExtension` để đăng ký việc chạy sau khi lưu và báo có thay đổi; form gọi
 * `registry.run(record)` sau khi lưu và gộp `registry.isDirty` vào điều kiện bật nút Lưu.
 */
export const FormExtensionContext = createContext<FormExtensionContextValue | null>(null);

/**
 * Sổ đăng ký phần mở rộng của một form.
 *
 * @param disabled - Form đang gửi hoặc bị khoá (slot khoá control theo).
 * @returns `context` cho Provider, `isDirty` (slot có thay đổi) và `run` chạy lần lượt mọi handler.
 */
export function useFormExtensionRegistry(disabled: boolean) {
  const handlers = useRef(new Set<FormExtensionHandler>());
  const [dirtyKeys, setDirtyKeys] = useState<string[]>([]);
  const register = useCallback((handler: FormExtensionHandler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);
  const setDirty = useCallback((key: string, dirty: boolean) => {
    setDirtyKeys((prev) => {
      if (dirty === prev.includes(key)) return prev;
      return dirty ? [...prev, key] : prev.filter((item) => item !== key);
    });
  }, []);
  const context = useMemo<FormExtensionContextValue>(
    () => ({ disabled, register, setDirty }),
    [disabled, register, setDirty],
  );
  return {
    context,
    isDirty: dirtyKeys.length > 0,
    run: async (record: { id: string }) => {
      for (const handler of handlers.current) await handler(record);
    },
  };
}

/**
 * Slot đăng ký việc chạy sau khi form cha lưu xong. Ngoài form có extension thì không làm gì.
 *
 * @param handler - Việc cần chạy (luôn dùng bản mới nhất).
 * @param dirty - Slot đang có thay đổi chưa lưu (bật nút Lưu của form cha).
 * @returns `disabled` khi form cha đang gửi hoặc bị khoá.
 */
export function useFormExtension(handler: FormExtensionHandler, dirty = false) {
  const context = useContext(FormExtensionContext);
  const key = useId();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  const register = context?.register;
  const setDirty = context?.setDirty;
  useEffect(() => register?.((record) => latest.current(record)), [register]);
  useEffect(() => {
    setDirty?.(key, dirty);
    return () => setDirty?.(key, false);
  }, [setDirty, key, dirty]);
  return { disabled: context?.disabled ?? false };
}
