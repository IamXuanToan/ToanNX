"use client";

import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { FormPageActionsContext } from "../../form-page/hooks/use-form-page-header";

/**
 * Thanh nút của form (Hủy rồi nút chính; `start` là ghi chú như "Có thay đổi chưa lưu").
 * Trong `FormPage`: nút được đưa lên **đầu trang dính** (cạnh tiêu đề), không nổi đè nội dung; nút submit
 * phải là `FormSubmitButton` (gắn `form=<id>` vì đã nằm ngoài thẻ `<form>`). Ngoài `FormPage`: hiện tại chỗ,
 * cuối form, căn phải.
 *
 * @param props - Các nút và ghi chú tuỳ chọn.
 * @returns Thanh nút.
 */
export function FormActions({ children, start }: { children: ReactNode; start?: ReactNode }) {
  const slot = useContext(FormPageActionsContext);
  const content = (
    <div data-testid="form-actions" className="flex flex-wrap items-center justify-end gap-2">
      {start ? <span className="text-muted-foreground mr-2 text-sm">{start}</span> : null}
      {children}
    </div>
  );
  if (slot) return createPortal(content, slot);
  return <div className="mt-6 border-t pt-5">{content}</div>;
}
