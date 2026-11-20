"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { TiptapInsertItem } from "../tiptap-editor.types";

type TiptapPluginRegistry = {
  items: TiptapInsertItem[];
  register: (item: TiptapInsertItem) => void;
  unregister: (key: string) => void;
};

/** Sổ mục chèn do module khác cắm vào editor (ảnh Thư viện, mã QR…) qua slot của page. */
export const TiptapPluginContext = createContext<TiptapPluginRegistry | null>(null);

/**
 * Tạo sổ plugin cho một editor. Bọc cả editor và các plugin bằng `TiptapPluginContext.Provider`.
 *
 * @returns Sổ plugin.
 */
export function useTiptapPluginRegistry(): TiptapPluginRegistry {
  const [entries, setEntries] = useState<Record<string, TiptapInsertItem>>({});
  const register = useCallback(
    (item: TiptapInsertItem) => setEntries((current) => ({ ...current, [item.key]: item })),
    [],
  );
  const unregister = useCallback(
    (key: string) =>
      setEntries((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      }),
    [],
  );
  return useMemo(
    () => ({ items: Object.values(entries), register, unregister }),
    [entries, register, unregister],
  );
}

/** @returns Mục chèn đã đăng ký (rỗng khi editor không nằm trong Provider). */
export function useTiptapPluginItems(): TiptapInsertItem[] {
  return useContext(TiptapPluginContext)?.items ?? [];
}

/**
 * Plugin đăng ký một mục vào menu "Chèn" của editor gần nhất. `run` luôn dùng bản mới nhất.
 *
 * ```tsx
 * function QrCodeTiptapPlugin() {
 *   const [editor, setEditor] = useState<Editor | null>(null);
 *   useTiptapInsertItem({ key: "qr-code", label: t("insert"), icon: QrCode, run: setEditor });
 *   return editor ? <QrCodePicker onPick={(image) => insertImage(editor, image)} /> : null;
 * }
 * ```
 *
 * @param item - Mục chèn.
 */
export function useTiptapInsertItem(item: TiptapInsertItem): void {
  const registry = useContext(TiptapPluginContext);
  const runRef = useRef(item.run);
  useEffect(() => {
    runRef.current = item.run;
  });
  const register = registry?.register;
  const unregister = registry?.unregister;
  const { key, label, icon } = item;
  useEffect(() => {
    if (!register || !unregister) return;
    register({ key, label, icon, run: (editor) => runRef.current(editor) });
    return () => unregister(key);
  }, [register, unregister, key, label, icon]);
}
