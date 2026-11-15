"use client";

import { type ReactNode, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";

import { FormPageActionsContext } from "../form-page/hooks/use-form-page-header";

/**
 * Dialog chứa **đúng form đầy đủ** của một tài nguyên (cùng component form với trang riêng), dùng để
 * tạo/sửa nhanh tài nguyên liên quan mà không rời form cha. `FormActions` bên trong tự đưa nút xuống chân
 * dialog (cùng cơ chế portal với `FormPage`). Không viết form rút gọn thứ hai.
 *
 * @param props - Trạng thái mở, tiêu đề, mô tả cho trình đọc màn hình, form.
 * @returns Dialog.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        <FormPageActionsContext.Provider value={slot}>{children}</FormPageActionsContext.Provider>
        <div ref={setSlot} className="flex justify-end gap-2 border-t pt-4 empty:hidden" />
      </DialogContent>
    </Dialog>
  );
}
