"use client";

import { useRef, useState } from "react";

import type { UploadedFile } from "../../file-upload-field/types";

/**
 * Upload một ảnh: chặn bấm chồng khi đang tải, báo lỗi theo `formatError`, thành công thì `onChange`.
 *
 * @param params - Callback upload, đổi giá trị và định dạng lỗi.
 * @returns Trạng thái đang tải, lỗi và hàm upload.
 */
export function useImageUpload({
  onUpload,
  onChange,
  formatError,
}: {
  onUpload: (file: File) => Promise<UploadedFile>;
  onChange: (value: UploadedFile | null) => void;
  formatError: (error: unknown) => string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  return {
    pending,
    error,
    upload: async (file: File) => {
      if (busy.current) return;
      busy.current = true;
      setPending(true);
      setError("");
      try {
        onChange(await onUpload(file));
      } catch (cause) {
        setError(formatError(cause));
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
  };
}
