"use client";

import { Copy, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Skeleton } from "@/shares/components/ui/skeleton";

import type { VaultItemReveal } from "../../types/vault-item.types";

/**
 * Dialog hiển thị bí mật đã giải mã sau khi kiểm quyền `workspace.vault_item.reveal`.
 *
 * @param props - Trạng thái mở, dữ liệu giải mã, cờ đang tải và hàm sao chép.
 * @returns Dialog hiển thị bí mật.
 */
export function VaultRevealDialog({
  open,
  onOpenChange,
  title,
  revealed,
  isRevealing,
  onCopy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  revealed: VaultItemReveal | null;
  isRevealing: boolean;
  onCopy: () => void;
}) {
  const t = useTranslations("workspace.vault");
  const tCommon = useTranslations("common.actions");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{revealed?.title || title || t("revealTitle")}</DialogTitle>
          <DialogDescription className="text-warning flex items-center gap-1.5 text-xs">
            <ShieldAlert className="size-4 shrink-0" aria-hidden />
            {t("revealNotice")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {isRevealing || !revealed ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : (
            <>
              {revealed.username ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground text-xs">{t("fields.username")}</p>
                  <p className="font-mono font-medium select-all">{revealed.username}</p>
                </div>
              ) : null}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">{t("fields.secret")}</p>
                <pre className="bg-muted overflow-x-auto rounded-lg border p-3 font-mono text-sm break-all whitespace-pre-wrap select-all">
                  {revealed.secret}
                </pre>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
          {revealed ? (
            <Button type="button" onClick={onCopy}>
              <Copy />
              {t("copySecret")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
