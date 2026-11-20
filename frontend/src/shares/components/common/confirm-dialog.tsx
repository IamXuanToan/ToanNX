"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shares/components/ui/alert-dialog";
import { Button } from "@/shares/components/ui/button";

/**
 * Hộp xác nhận chuẩn cho thao tác không hoàn tác được (xoá, xoá hàng loạt).
 * Nút xác nhận đỏ khi `destructive`; đang xử lý thì khoá cả hai nút.
 *
 * @param props - Trạng thái mở, nội dung, nhãn nút và callback.
 * @returns Hộp xác nhận.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending,
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  isPending?: boolean;
  destructive?: boolean;
}) {
  const t = useTranslations("common.actions");
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={onConfirm}
            data-testid="confirm-dialog-confirm"
          >
            {isPending ? <Loader2 className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
