"use client";
import { useRef, useState } from "react";
import type { FileUploadOptions } from "../types";
/** Upload tuần tự, giữ các file đã thành công và báo lỗi bằng FieldError của common. */
export function useFileUploadField({
  onUpload,
  onChange,
  files,
  formatError,
  maxFiles = 1,
}: FileUploadOptions) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  return {
    pending,
    error,
    upload: async (selected: File[]) => {
      if (busy.current) return;
      busy.current = true;
      setPending(true);
      setError("");
      const next = [...files];
      try {
        for (const file of selected.slice(0, Math.max(0, maxFiles - files.length)))
          next.push(await onUpload(file));
      } catch (cause) {
        setError(formatError(cause));
      } finally {
        onChange(next);
        busy.current = false;
        setPending(false);
      }
    },
    remove: (id: string) => onChange(files.filter((file) => file.id !== id)),
  };
}
