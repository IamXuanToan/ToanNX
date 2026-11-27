"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";

import { FormPageActionsContext } from "./hooks/use-form-page-header";
import { useFormDialog } from "./hooks/use-form-dialog";

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
  const { slot, setSlot } = useFormDialog();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <FormPageActionsContext.Provider value={slot}>{children}</FormPageActionsContext.Provider>
        </div>
        <div
          ref={setSlot}
          className="bg-muted/50 flex shrink-0 justify-end gap-2 rounded-b-xl border-t px-6 py-4 empty:hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
