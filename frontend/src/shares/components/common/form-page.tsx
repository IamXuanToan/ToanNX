"use client";

import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";

import { EditModeButton } from "./edit-mode-button";
import { PageHeader } from "./page-header";
import { FormPageActionsContext, useFormPageHeader } from "./hooks/use-form-page-header";

/**
 * Khung trang tạo/sửa/chi tiết chuẩn: cột nội dung rộng tối đa 72rem **căn giữa** vùng làm việc.
 * Đầu trang là **một card** (tiêu đề + thanh nút của form) **dính ngay dưới header** khi cuộn: Hủy/Tạo/Lưu
 * luôn bấm được mà không đè lên nội dung. Đồng thời cung cấp `--tiptap-sticky-top` để thanh công cụ
 * `TiptapToolbar` hoặc khung xem trước dính ngay mép dưới card này.
 *
 * @param props - Tiêu đề, nút thêm ở đầu trang và nội dung (form).
 * @returns Trang form.
 */
export function FormPage({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { setSentinel, setStickyBar, stickyTop, stuck, slot, setSlot } = useFormPageHeader();
  const stickyVars = { "--tiptap-sticky-top": `${stickyTop}px` } as CSSProperties;

  return (
    <FormPageActionsContext.Provider value={slot}>
      <div className="mx-auto w-full max-w-6xl" style={stickyVars}>
        <div ref={setSentinel} aria-hidden className="h-0" />
        {/* Card nằm cách header 16px cả lúc đầu lẫn lúc dính: kéo dải bọc lên hết phần đệm trên của vùng
            nội dung, dải nền canvas 16px phía trên card che nội dung cuộn qua giữa header và card. */}
        <div
          ref={setStickyBar}
          className="bg-canvas sticky top-16 z-10 -mt-4 mb-6 pt-4 sm:-mt-6 lg:-mt-8"
        >
          <div
            data-stuck={stuck || undefined}
            className={cn(
              "bg-card rounded-xl border px-4 py-3 transition-shadow sm:px-5",
              "data-stuck:shadow-md",
            )}
          >
            <PageHeader
              title={title}
              inline
              actions={
                <>
                  {actions}
                  <EditModeButton />
                  <div ref={setSlot} className="flex items-center gap-2 empty:hidden" />
                </>
              }
            />
          </div>
        </div>
        {children}
      </div>
    </FormPageActionsContext.Provider>
  );
}
